import _Post from '../../models/post';
import _Comment from '../../models/comment';
import _File from '../../models/file';
import { Types } from 'mongoose';
import { ErrorApi } from '../../middleware/error';
import redisClient from '../../databases/connectRedis';
import { S3Service } from '../storage/s3.service';
import { BUCKET_NAME } from '../../databases/s3';
import { uploadProducer } from '../queue/uploadProducer.services';
import { encodePostProducer } from '../queue/encodePostProducer.services';
import { handleNotification } from '../notification/notification.services';
import _User from '../../models/user';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { encodePost } from '../ai/ai.service';

const getPresignedUrl = async (url: string): Promise<string> => {
    if (!url) return url;
    if (url.includes('amazonaws.com')) {
        try {
            const match = url.match(/amazonaws\.com\/(.+)$/);
            if (match) {
                const key = match[1];
                return await S3Service.getSignedUrl(key, 86400);
            }
        } catch (error) {
            console.error('Error generating presigned URL:', error);
        }
    }
    return url;
};

const addStandardPostFields = async (posts: any[], userId?: string): Promise<any[]> => {
    const userObjectId = userId ? new Types.ObjectId(userId) : null;

    const processedPosts = await Promise.all(posts.map(async (post: any) => {
        if (post.imgUrl && Array.isArray(post.imgUrl) && post.imgUrl.length > 0) {
            post.imgUrl = await Promise.all(
                post.imgUrl.map((url: string) => getPresignedUrl(url))
            );
        }

        if (post.videoUrl && Array.isArray(post.videoUrl) && post.videoUrl.length > 0) {
            post.videoUrl = await Promise.all(
                post.videoUrl.map((url: string) => getPresignedUrl(url))
            );
        }
        let liked = false;

        if (userObjectId && post.react && Array.isArray(post.react)) {
            liked = post.react.some((reactUserId: any) => {
                return reactUserId.toString() === userObjectId.toString();
            });
        }
        const userLikePreview = post.reactUsers?.slice(0, 3).map((u: any) => ({
            _id: u._id,
            username: u.name
        })) || [];

        const edited = post.updatedAt && post.createdAt
            ? new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000
            : false;

        delete post.react;
        delete post.reactUsers;

        return {
            ...post,
            liked,
            userLikePreview,
            edited,
            status: post.status || 'active'
        };
    }));

    return processedPosts;
};

export class PostService {
    async createPost(title: string, content: string, userId: string, files: Express.Multer.File[]) {
        const newPost = await _Post.create({
            title,
            artistId: userId,
            content,
        }) as any;

        if (files.length > 0) {
            const listPath = {
                uid: userId,
                postId: newPost._id,
                paths: files.map(file => file.path)
            };
            await uploadProducer(JSON.stringify(listPath));
        }

        encodePost(newPost._id.toString(), newPost.content).catch(err =>
            console.error('Failed to queue post for encoding:', err)
        );

        return newPost;
    }

    async grantPermissionUploadFile(typeImg: string, title: string, content: string, userId: string, contentType?: string, postId?: string, files?: Array<{ contentType: string, fileName: string, fileSize: number }>) {
        if (!typeImg) {
            throw new ErrorApi(400, "Type image missing");
        }
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
        ];

        const folder = typeImg === "avatar" ? "avatar" : "upload";

        if (postId && files && Array.isArray(files) && files.length > 0) {
            console.log("Khi co file")
            for (const file of files) {
                if (!allowedTypes.includes(file.contentType)) {
                    throw new ErrorApi(400, `File type ${file.contentType} is not allowed. Only images and videos are supported.`);
                }
            }

            const uploadUrls = await Promise.all(
                files.map(async (file) => {
                    const fileKey = `${folder}/${postId}/${uuidv4()}`;
                    const presignedData = await S3Service.getPresignedUploadUrl(
                        fileKey,
                        file.contentType,
                        3600
                    );
                    return {
                        uploadUrl: presignedData.url,
                        key: presignedData.key,
                        fileName: file.fileName,
                        fileSize: file.fileSize
                    };
                })
            );

            return {
                uploadUrls,
                postId,
                bucket: BUCKET_NAME,
                region: process.env.AWS_REGION || 'us-east-1',
                folder
            };
        }

        if (contentType && !allowedTypes.includes(contentType)) {
            throw new ErrorApi(400, `File type ${contentType} is not allowed. Only images and videos are supported.`);
        }

        const post_draft = await _Post.create({ title, artistId: userId, content });

        if (!post_draft) {
            throw new ErrorApi(500, "Create post draft fail");
        }

        console.log("Created post draft with ID:", post_draft._id);

        await encodePostProducer(post_draft);
        const fileKey = `${folder}/${post_draft._id}/${uuidv4()}`;
        const presignedData = await S3Service.getPresignedUploadUrl(
            fileKey,
            contentType || 'application/octet-stream',
            3600
        );

        const information = {
            uploadUrl: presignedData.url,
            key: presignedData.key,
            bucket: BUCKET_NAME,
            region: process.env.AWS_REGION || 'us-east-1',
            folder,
            postId: post_draft._id as string,
            timestamp: Date.now()
        };

        return information;
    }

    async grantPermissionForUpdatePost(postId: string, typeImg: string, userId: string) {
        if (!postId) {
            throw new ErrorApi(400, "Post ID missing");
        }

        if (!typeImg) {
            throw new ErrorApi(400, "Type image missing");
        }
        const post = await _Post.findOne({ _id: postId, artistId: userId });

        if (!post) {
            throw new ErrorApi(404, "Post not found or you don't have permission");
        }

        const folder = typeImg === "avatar" ? "avatar" : "upload";
        const fileKey = `${folder}/${postId}/${uuidv4()}`;
        const presignedData = await S3Service.getPresignedUploadUrl(
            fileKey,
            'image/*',
            3600
        );

        const information = {
            uploadUrl: presignedData.url,
            key: presignedData.key,
            bucket: BUCKET_NAME,
            region: process.env.AWS_REGION || 'us-east-1',
            folder,
            postId: postId,
            timestamp: Date.now()
        };

        return information;
    }

    async updateFile(listFile: any[], postId: string) {
        if (!Array.isArray(listFile) || listFile.length === 0) {
            throw new ErrorApi(400, "Danh sách file trống hoặc không hợp lệ");
        }

        const fileDocs = listFile.map(f => {
            const doc: any = {
                public_id: f.key || f.public_id, // S3 key
                format: f.format || f.key?.split('.').pop() || 'unknown',
                created_at: f.created_at || new Date(),
                resource_type: f.resource_type || f.type || 'image',
                tags: f.tags || [],
                bytes: f.bytes || f.size || 0,
                secure_url: f.url || f.secure_url,
                folder: f.folder || f.asset_folder,
                postId: postId || null,
            };

            if (f.width) doc.width = f.width;
            if (f.height) doc.height = f.height;

            return doc;
        });

        await _File.insertMany(fileDocs);

        return { count: fileDocs.length };
    }

    async updatePost(postId: string, title: string, content: string, userId: string, files?: any[]) {
        console.log("checked 1");
        const existingPost = await _Post.findOne({ _id: postId });

        if (!existingPost) {
            throw new ErrorApi(404, "Post not found");
        }

        if (existingPost.artistId.toString() !== userId) {
            throw new ErrorApi(403, "You don't have permission to update this post");
        }

        const post = await _Post.findOneAndUpdate(
            { _id: postId },
            { title, content },
            { new: true }
        );

        if (!post) {
            throw new ErrorApi(400, "Update post failed");
        }

        if (files && Array.isArray(files)) {
            console.log("checked 2 - Processing files: ", files);

            // Delete existing files
            await _File.deleteMany({ postId: postId });

            if (files.length > 0) {
                // Handle both string URLs and objects
                const fileDocs = files
                    .map(f => {
                        // If it's an object with url/secure_url
                        if (typeof f === 'object' && (f.url || f.secure_url)) {
                            return {
                                public_id: f.key || f.public_id,
                                width: f.width || null,
                                height: f.height || null,
                                format: f.format || f.key?.split('.').pop() || 'unknown',
                                created_at: f.created_at || new Date(),
                                resource_type: f.resource_type || f.type || 'image',
                                tags: f.tags || [],
                                bytes: f.bytes || f.size || 0,
                                secure_url: f.url || f.secure_url,
                                folder: f.asset_folder || f.folder,
                                postId: postId,
                            };
                        }
                        // If it's a string URL, create a basic file document
                        else if (typeof f === 'string') {
                            // Determine resource type from URL
                            const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(f);
                            return {
                                public_id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                secure_url: f,
                                resource_type: isVideo ? 'video' : 'image',
                                postId: postId,
                            };
                        }
                        return null;
                    })
                    .filter(f => f !== null);

                console.log("checked 3 - Processed file docs: ", fileDocs.length);

                if (fileDocs.length > 0) {
                    await _File.insertMany(fileDocs);
                }
            }
        }
        return post;
    }

    async getPost(postId: string, userId?: string) {
        if (!postId) {
            throw new ErrorApi(400, "Post id not found");
        }

        const post = await _Post.aggregate([
            { $match: { _id: new Types.ObjectId(postId) } },
            { $addFields: { likeCount: { $size: { $ifNull: ['$react', []] } } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'artistId',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'react',
                    foreignField: '_id',
                    as: 'reactUsers'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            { $addFields: { commentCount: { $size: { $ifNull: ['$comments', []] } } } },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1,
                    react: 1,
                    reactUsers: { _id: 1, name: 1 },
                    files: 1,
                    imgUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$files',
                                    as: 'file',
                                    cond: { $eq: ['$$file.resource_type', 'image'] }
                                }
                            },
                            as: 'img',
                            in: '$$img.secure_url'
                        }
                    },
                    videoUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$files',
                                    as: 'file',
                                    cond: { $eq: ['$$file.resource_type', 'video'] }
                                }
                            },
                            as: 'video',
                            in: '$$video.secure_url'
                        }
                    },
                    author: {
                        _id: '$author._id',
                        name: '$author.name',
                        avatar: '$author.avatar',
                        email: '$author.email'
                    }
                }
            }
        ]);

        if (!post || post.length === 0) {
            throw new ErrorApi(404, "Post not found");
        }
        const processedPosts = await addStandardPostFields(post, userId);
        return processedPosts[0];
    }

    async hiddenPost(postId: string, accountId: string) {
        const post = await _Post.findOne({ _id: postId });
        if (!post) throw new ErrorApi(404, "Post not found");

        // This is user deleting their own post probably?
        await _Post.deleteById(postId);
        return true;
    }

    async setPostVisibility(postId: string, visible: boolean) {
        const post = await _Post.findOne({ _id: postId });
        if (!post) throw new ErrorApi(404, "Post not found");


        if (visible) {
            // Unhide -> restore
            await _Post.restore({ _id: postId });
        } else {
            // Hide -> soft delete
            await _Post.deleteById(postId);
        }
        return true;
    }

    async reactPost(userId: string, postID: string) {
        const post = await _Post.findById(postID);
        if (!post) {
            throw new ErrorApi(404, "Post not found");
        }

        const userObjectId = new Types.ObjectId(userId);
        const isLiked = post.react?.includes(userObjectId);

        if (isLiked) {
            await _Post.findByIdAndUpdate(
                postID,
                { $pull: { react: userObjectId } },
                { new: true }
            );
            return { liked: false };
        }
        await _Post.findByIdAndUpdate(
            postID,
            { $addToSet: { react: userObjectId } },
            { new: true }
        );
        //send
        if (post.artistId.toString() !== userId) {
            const user = await _User.findById(userId).select('name');
            await handleNotification({
                message: `${user?.name || 'Someone'} đã thích bài viết của bạn`,
                title: 'Lượt thích mới',
                receiver: post.artistId,
                sender: userObjectId,
                type: 'like',
                read: false,
                link: `/posts/${postID}`,
                postId: new Types.ObjectId(postID)
            } as any);
        }

        return { liked: true };
    }

    async getAllPost(page: number = 1, limit: number = 10, sortBy: string = 'latest', userId?: string) {
        const skip: number = (page - 1) * limit;

        let sortCriteria: any = { createdAt: -1 };

        switch (sortBy.toLowerCase()) {
            case 'likes':
                sortCriteria = { likeCount: -1, createdAt: -1 };
                break;
            case 'comments':
                sortCriteria = { commentCount: -1, createdAt: -1 };
                break;
            case 'earliest':
                sortCriteria = { createdAt: 1 };
                break;
            case 'latest':
            default:
                sortCriteria = { createdAt: -1 };
                break;
        }

        const listPost = await _Post.aggregate([
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'artistId',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'video'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1,
                    react: 1,
                    reactUsers: { _id: 1, name: 1 },
                    files: 1,
                    imgUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$files',
                                    as: 'file',
                                    cond: { $eq: ['$$file.resource_type', 'image'] }
                                }
                            },
                            as: 'img',
                            in: '$$img.secure_url'
                        }
                    },
                    videoUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$files',
                                    as: 'file',
                                    cond: { $eq: ['$$file.resource_type', 'video'] }
                                }
                            },
                            as: 'video',
                            in: '$$video.secure_url'
                        }
                    },
                    author: {
                        _id: '$author._id',
                        name: '$author.name',
                        avatar: '$author.avatar',
                        email: '$author.email'
                    }
                }
            },
            {
                $sort: sortCriteria
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        return await addStandardPostFields(listPost, userId);
    }


    async removePost(postId: string) {
        console.log("Removing post with ID:", postId);
        return await _Post.findByIdAndDelete(postId);
    }

    async getPostLikedOfUser(userId: string) {
        const listPost = await _Post.aggregate([
            { $match: { react: { $in: [new Types.ObjectId(userId)] } } },
            { $addFields: { likeCount: { $size: { $ifNull: ['$react', []] } } } },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'video'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    createdAt: 1
                }
            }
        ]);

        return listPost;
    }

    async getPostUserCommented(userId: string) {
        const listPost = await _Comment.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$postId',
                    comments: { $push: '$_id' },
                    userIds: { $addToSet: '$userId' }
                }
            },
            { $addFields: { commentCount: { $size: '$comments' } } },
            {
                $lookup: {
                    from: 'posts',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            { $unwind: '$post' },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$post.react', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'video'] }
                            }
                        }
                    }
                }
            },
            { $project: { _id: 0, comments: 0, files: 0 } }
        ]);

        return listPost;
    }

    async getPostOfUser(userId: string) {
        const listPost = await _Post.aggregate([
            { $match: { artistId: new Types.ObjectId(userId) } },
            { $addFields: { likeCount: { $size: { $ifNull: ['$react', []] } } } },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'video'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    createdAt: 1
                }
            }
        ]);

        return listPost;
    }

    async getMyPost(userId: string) {
        const post = await _Post.find({ artistId: userId })
            .populate('artistId')
            .populate('comments')
            .sort({ createdAt: -1 });

        return post;
    }

    async getTopPost(limit: number = 10, period: string = 'week') {
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
            default:
                startDate = new Date(0); // Beginning of time
                break;
        }

        const topPosts = await _Post.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    visibility: 'published'
                }
            },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'artistId',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: '$files',
                                as: 'file',
                                cond: { $eq: ['$$file.resource_type', 'video'] }
                            }
                        }
                    },
                    // Calculate engagement score: likes * 2 + comments * 3
                    engagementScore: {
                        $add: [
                            { $multiply: [{ $size: { $ifNull: ['$react', []] } }, 2] },
                            { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 3] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    engagementScore: 1,
                    createdAt: 1,
                    imgUrl: '$files.secure_url',
                    author: {
                        _id: '$author._id',
                        name: '$author.name',
                        avatar: '$author.avatar',
                        avt_url: '$author.avt_url'
                    }
                }
            },
            {
                $sort: { engagementScore: -1, likeCount: -1, commentCount: -1 }
            },
            {
                $limit: limit
            }
        ]);

        return topPosts;
    }

    async searchPost(keyword: string, page: number = 1, limit: number = 10) {
        const skip: number = (page - 1) * limit;
        const searchRegex = new RegExp(keyword, 'i');

        const listPost = await _Post.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'artistId',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        { title: searchRegex },
                        { content: searchRegex },
                        { 'author.name': searchRegex }
                    ]
                }
            },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'files'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } }
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    imgUrl: '$files.secure_url',
                    author: {
                        _id: '$author._id',
                        name: '$author.name',
                        avatar: '$author.avatar'
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        return listPost;
    }

    async getSimilarPosts(postId: string, limit: number = 5, userId?: string) {
        // Get current post with embedding
        const currentPost = await _Post.findById(postId).select('embedding content title');

        if (!currentPost) {
            throw new ErrorApi(404, "Post not found");
        }

        // If no embedding, fallback to recent posts
        if (!currentPost.embedding || currentPost.embedding.length === 0) {
            console.log('No embedding found for post, returning recent posts');
            return await this.getAllPost(1, limit, 'latest', userId);
        }

        try {
            // Direct query approach - calculate similarity in Node.js
            const postsWithEmbeddings = await _Post.find({
                _id: { $ne: new Types.ObjectId(postId) },
                embedding: { $exists: true, $ne: [] }
            }).select('_id embedding').lean();

            if (postsWithEmbeddings.length === 0) {
                console.log('No other posts with embeddings, returning recent posts');
                return await this.getAllPost(1, limit, 'latest', userId);
            }

            // Filter valid 384-dim embeddings
            const validPosts = postsWithEmbeddings.filter(p =>
                Array.isArray(p.embedding) && p.embedding.length === 384
            );

            if (validPosts.length === 0) {
                console.log('No valid 384-dim embeddings, returning recent posts');
                return await this.getAllPost(1, limit, 'latest', userId);
            }

            // Calculate cosine similarity
            const similarities = validPosts.map(post => {
                const similarity = this.cosineSimilarity(
                    currentPost.embedding as number[],
                    post.embedding as number[]
                );
                return { postId: post._id, similarity };
            });

            // Sort and get top N
            similarities.sort((a, b) => b.similarity - a.similarity);
            const topSimilar = similarities.slice(0, limit);

            if (topSimilar.length === 0) {
                return await this.getAllPost(1, limit, 'latest', userId);
            }

            // Fetch full post details
            const similarPostIds = topSimilar.map(s => s.postId);
            const similarPosts = await _Post.aggregate([
                { $match: { _id: { $in: similarPostIds } } },
                { $addFields: { likeCount: { $size: { $ifNull: ['$react', []] } } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'artistId',
                        foreignField: '_id',
                        as: 'author'
                    }
                },
                {
                    $unwind: {
                        path: '$author',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'react',
                        foreignField: '_id',
                        as: 'reactUsers'
                    }
                },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'comments'
                    }
                },
                {
                    $lookup: {
                        from: 'files',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'files'
                    }
                },
                { $addFields: { commentCount: { $size: { $ifNull: ['$comments', []] } } } },
                {
                    $project: {
                        title: 1,
                        content: 1,
                        likeCount: 1,
                        commentCount: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        status: 1,
                        react: 1,
                        reactUsers: { _id: 1, name: 1 },
                        files: 1,
                        imgUrl: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$files',
                                        as: 'file',
                                        cond: { $eq: ['$$file.resource_type', 'image'] }
                                    }
                                },
                                as: 'img',
                                in: '$$img.secure_url'
                            }
                        },
                        videoUrl: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$files',
                                        as: 'file',
                                        cond: { $eq: ['$$file.resource_type', 'video'] }
                                    }
                                },
                                as: 'video',
                                in: '$$video.secure_url'
                            }
                        },
                        author: {
                            _id: '$author._id',
                            name: '$author.name',
                            avatar: '$author.avatar',
                            email: '$author.email'
                        }
                    }
                }
            ]);

            // Sort by original similarity order
            const orderedPosts = similarPostIds.map((id: any) =>
                similarPosts.find((p: any) => p._id.toString() === id.toString())
            ).filter((p: any) => p);

            console.log(`✅ Found ${orderedPosts.length} similar posts for ${postId}`);
            return await addStandardPostFields(orderedPosts, userId);

        } catch (error) {
            console.error('Error getting similar posts:', error);
            // Fallback to recent posts on error
            return await this.getAllPost(1, limit, 'latest', userId);
        }
    }

    // Helper function to calculate cosine similarity
    private cosineSimilarity(vec1: number[], vec2: number[]): number {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
}

export default new PostService();
