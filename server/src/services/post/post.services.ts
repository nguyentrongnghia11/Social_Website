import _Post from '../../models/post';
import _Comment from '../../models/comment';
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

    console.log("Adding standard fields to posts. Total posts:", posts.length, "User ID:", userId);
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
        // Lấy thông tin tác giả để nhúng vào post (Extended Reference Pattern)
        const user = await _User.findById(userId).select('name username avt_url').lean();

        const newPost = await _Post.create({
            title,
            artistId: userId,
            content,
            // Nhúng snapshot tác giả — tránh $lookup mỗi lần get posts
            author: user ? {
                _id: user._id,
                name: user.name,
                username: (user as any).username,
                avt_url: user.avt_url
            } : undefined
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
            for (const file of files) {
                if (!allowedTypes.includes(file.contentType)) {
                    throw new ErrorApi(400, `File type ${file.contentType} is not allowed. Only images and videos are supported.`);
                }
            }

            const uploadUrls = await Promise.all(
                files.map(async (file) => {
                    const fileKey = `${folder}/${postId}/${uuidv4()}`;

                    console.log("fileKey", file.contentType);
                    const presignedData = await S3Service.getPresignedUploadUrl(
                        fileKey,
                        file.contentType,
                        3600
                    );

                    console.log("presignedData", presignedData.url)


                    return {
                        uploadUrl: presignedData.url,
                        key: presignedData.key,
                        fileName: file.fileName,
                        fileSize: file.fileSize,
                        fileType: file.contentType
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

        const author = await _User.findById(userId).select('name username avt_url').lean();

        const post_draft = await _Post.create({
            title,
            artistId: userId,
            content,
            author: author ? {
                _id: author._id,
                name: author.name,
                username: (author as any).username,
                avt_url: author.avt_url
            } : undefined
        });

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

        console.log('presignedData', presignedData.url)

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

        const mediaItems = listFile.map((f: any) => ({
            url: f.url || f.secure_url,
            resource_type: f.resource_type === 'video' || f.type === 'video' ? 'video' : 'image',
            public_id: f.key || f.public_id,
            bytes: f.bytes || f.size || 0,
            width: f.width,
            height: f.height,
            format: f.format || f.key?.split('.').pop() || 'unknown'
        }));

        const images = mediaItems.filter((m: any) => m.resource_type === 'image');
        const videos = mediaItems.filter((m: any) => m.resource_type === 'video');

        await _Post.findByIdAndUpdate(postId, {
            $push: { media: { $each: mediaItems } },
            $inc: {
                imageCount: images.length,
                videoCount: videos.length
            }
        });

        // Set thumbnail nếu chưa có
        if (images.length > 0) {
            await _Post.updateOne(
                { _id: postId, $or: [{ thumbnail: { $exists: false } }, { thumbnail: null }, { thumbnail: '' }] },
                { $set: { thumbnail: images[0].url } }
            );
        }

        return { count: mediaItems.length };
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

        const updatePayload: any = { title, content };

        if (files && Array.isArray(files)) {
            console.log("checked 2 - Processing files: ", files);

            const mediaItems = files
                .map((f: any) => {
                    if (typeof f === 'object' && (f.url || f.secure_url)) {
                        return {
                            url: f.url || f.secure_url,
                            resource_type: f.resource_type === 'video' || f.type === 'video' ? 'video' : 'image',
                            public_id: f.key || f.public_id,
                            bytes: f.bytes || f.size || 0,
                            width: f.width,
                            height: f.height,
                            format: f.format || f.key?.split('.').pop() || 'unknown'
                        };
                    }
                    if (typeof f === 'string') {
                        const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(f);
                        return {
                            url: f,
                            resource_type: isVideo ? 'video' : 'image',
                            public_id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            bytes: 0
                        };
                    }
                    return null;
                })
                .filter((item: any) => item !== null);

            const images = mediaItems.filter((m: any) => m.resource_type === 'image');
            const videos = mediaItems.filter((m: any) => m.resource_type === 'video');

            updatePayload.media = mediaItems;
            updatePayload.imageCount = images.length;
            updatePayload.videoCount = videos.length;
            updatePayload.thumbnail = images.length > 0 && images[0] ? images[0].url : null;
        }

        const post = await _Post.findOneAndUpdate(
            { _id: postId },
            updatePayload,
            { new: true }
        );

        if (!post) {
            throw new ErrorApi(400, "Update post failed");
        }

        return post;
    }

    async getPost(postId: string, userId?: string) {
        if (!postId) {
            throw new ErrorApi(400, "Post id not found");
        }

        const userObjectId = userId ? new Types.ObjectId(userId) : null;

        const post = await _Post.aggregate([
            { $match: { _id: new Types.ObjectId(postId) } },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } },
                    liked: userObjectId
                        ? { $in: [userObjectId, { $ifNull: ['$react', []] }] }
                        : false
                }
            },
            // Lấy tất cả user đã like (chỉ 3 cái đầu cho preview)
            {
                $lookup: {
                    from: 'users',
                    localField: 'react',
                    foreignField: '_id',
                    as: 'reactUsers',
                    pipeline: [
                        { $limit: 3 },
                        { $project: { _id: 1, name: 1, avt_url: 1 } }
                    ]
                }
            },
            // Đếm comment
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: '_commentDocs',
                    pipeline: [{ $project: { _id: 1 } }]
                }
            },
            { $addFields: { commentCount: { $size: { $ifNull: ['$_commentDocs', []] } } } },
            {
                $project: {
                    title: 1,
                    content: 1,
                    likeCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1,
                    liked: 1,
                    author: 1,  // đã embedded
                    artistId: 1,
                    // Media từ embedded array — phân loại rõ ảnh và video
                    media: 1,
                    imgUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: { $ifNull: ['$media', []] },
                                    as: 'm',
                                    cond: { $eq: ['$$m.resource_type', 'image'] }
                                }
                            },
                            as: 'img',
                            in: '$$img.url'
                        }
                    },
                    videoUrl: {
                        $map: {
                            input: {
                                $filter: {
                                    input: { $ifNull: ['$media', []] },
                                    as: 'm',
                                    cond: { $eq: ['$$m.resource_type', 'video'] }
                                }
                            },
                            as: 'vid',
                            in: '$$vid.url'
                        }
                    },
                    reactUsers: 1,
                    imageCount: 1,
                    videoCount: 1,
                    thumbnail: 1
                }
            }
        ]);

        if (!post || post.length === 0) {
            throw new ErrorApi(404, "Post not found");
        }

        // Sign presigned URLs cho S3
        const result = post[0];
        if (result.imgUrl?.length > 0) {
            result.imgUrl = await Promise.all(
                result.imgUrl.map((url: string) => getPresignedUrl(url))
            );
        }
        if (result.videoUrl?.length > 0) {
            result.videoUrl = await Promise.all(
                result.videoUrl.map((url: string) => getPresignedUrl(url))
            );
        }

        // userLikePreview
        result.userLikePreview = (result.reactUsers || []).slice(0, 3).map((u: any) =>
            ({ _id: u._id, username: u.name })
        );
        delete result.reactUsers;

        return result;
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
        const userObjectId = userId ? new Types.ObjectId(userId) : null;

        // Map sort key từ frontend sang field trong DB
        const sortMap: Record<string, any> = {
            'likes': { likeCount: -1, createdAt: -1 },
            'comments': { commentCount: -1, createdAt: -1 },
            'earliest': { createdAt: 1 },
            'latest': { createdAt: -1 },
            '-createdAt': { createdAt: -1 },
            'createdAt': { createdAt: 1 },
            '-likeCount': { likeCount: -1, createdAt: -1 },
            '-commentCount': { commentCount: -1, createdAt: -1 },
        };
        const sortCriteria = sortMap[sortBy] ?? { createdAt: -1 };

        //
        // getAllPost trả về ĐÚÂ TỐI THIỂU để hiển thị card.
        // Không có content, không có react[], không có files[].
        // Tất cả các giá trị count được tính từ embedded fields hoặc 1 đoạn count nhẹ.
        //
        const listPost = await _Post.aggregate([
            { $match: { deleted: { $ne: true } } },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } },
                    // liked: kiểm tra user hiện tại có trong react[] không (không cần lookup)
                    liked: userObjectId
                        ? { $in: [userObjectId, { $ifNull: ['$react', []] }] }
                        : false
                }
            },
            // Đếm comment — chỉ count, không kéo data
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: '_commentDocs',
                    pipeline: [{ $project: { _id: 1 } }]  // chỉ _id để đếm
                }
            },
            {
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$_commentDocs', []] } },
                    // imageCount/videoCount/thumbnail: dùng từ embedded media[]
                    // Nếu chưa có (backfill chưa chạy): fallback về 0
                    imageCount: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                            then: {
                                $size: {
                                    $filter: {
                                        input: { $ifNull: ['$media', []] },
                                        as: 'm',
                                        cond: { $eq: ['$$m.resource_type', 'image'] }
                                    }
                                }
                            },
                            else: { $ifNull: ['$imageCount', 0] }
                        }
                    },
                    videoCount: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                            then: {
                                $size: {
                                    $filter: {
                                        input: { $ifNull: ['$media', []] },
                                        as: 'm',
                                        cond: { $eq: ['$$m.resource_type', 'video'] }
                                    }
                                }
                            },
                            else: { $ifNull: ['$videoCount', 0] }
                        }
                    },
                    // thumbnail: ảnh đầu tiên trong media[], fallback về thumbnail field
                    thumbnail: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$media', []] } }, 0] },
                            then: {
                                $let: {
                                    vars: {
                                        firstImage: {
                                            $first: {
                                                $filter: {
                                                    input: { $ifNull: ['$media', []] },
                                                    as: 'm',
                                                    cond: { $eq: ['$$m.resource_type', 'image'] }
                                                }
                                            }
                                        }
                                    },
                                    in: '$$firstImage.url'
                                }
                            },
                            else: { $ifNull: ['$thumbnail', null] }
                        }
                    }
                }
            },
            // Project chỉ các field cần thiết cho card
            {
                $project: {
                    _id: 1,
                    title: 1,
                    createdAt: 1,
                    // Author từ embedded field (không cần $lookup users)
                    author: 1,
                    // Counts
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    // Preview
                    thumbnail: 1,
                    liked: 1,
                    // Loại bỏ: content, react[], media[], _commentDocs
                }
            },
            { $sort: sortCriteria },
            { $skip: skip },
            { $limit: limit }
        ]);

        return listPost;
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
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: { $ifNull: ['$imageCount', 0] },
                    videoCount: { $ifNull: ['$videoCount', 0] }
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
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$post.react', []] } },
                    imageCount: { $ifNull: ['$post.imageCount', 0] },
                    videoCount: { $ifNull: ['$post.videoCount', 0] }
                }
            },
            { $project: { _id: 0, comments: 0 } }
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
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: { $ifNull: ['$imageCount', 0] },
                    videoCount: { $ifNull: ['$videoCount', 0] }
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

    async getTopPost(limit: number = 10, period: string = 'week', page: number = 1) {
        const cacheKey = `top_posts:${period}:${page}:${limit}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const startDate = this.getStartDate(period);
        const skip = (page - 1) * limit;

        // Helper expression dùng chung cho thumbnail (ảnh đầu tiên trong media[])
        const thumbnailExpr = {
            $let: {
                vars: {
                    firstImg: {
                        $first: {
                            $filter: {
                                input: { $ifNull: ['$media', []] },
                                as: 'm',
                                cond: { $eq: ['$$m.resource_type', 'image'] }
                            }
                        }
                    }
                },
                in: { $ifNull: ['$$firstImg.url', '$thumbnail'] }
            }
        };

        const [result] = await _Post.aggregate([
            { $match: { createdAt: { $gte: startDate }, deleted: { $ne: true } } },
            // Đếm comment nhẹ
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: '_c',
                    pipeline: [{ $project: { _id: 1 } }]
                }
            },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } },
                    commentCount: { $size: { $ifNull: ['$_c', []] } },
                    imageCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$media', []] },
                                as: 'm',
                                cond: { $eq: ['$$m.resource_type', 'image'] }
                            }
                        }
                    },
                    videoCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$media', []] },
                                as: 'm',
                                cond: { $eq: ['$$m.resource_type', 'video'] }
                            }
                        }
                    },
                    thumbnail: thumbnailExpr
                }
            },
            {
                $project: {
                    _id: 1, title: 1, author: 1, createdAt: 1,
                    likeCount: 1, commentCount: 1,
                    imageCount: 1, videoCount: 1, thumbnail: 1
                }
            },
            { $sort: { likeCount: -1, commentCount: -1, createdAt: -1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ]);

        const response = {
            data: result?.data ?? [],
            pagination: {
                total: result?.metadata[0]?.total ?? 0,
                page,
                limit,
                pages: Math.ceil((result?.metadata[0]?.total ?? 0) / limit)
            }
        };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
        return response;
    }

    /** Tính ngày bắt đầu của period */
    private getStartDate(period: string): Date {
        const now = new Date();
        switch (period) {
            case 'day': return new Date(now.setDate(now.getDate() - 1));
            case 'week': return new Date(now.setDate(now.getDate() - 7));
            case 'month': return new Date(now.setMonth(now.getMonth() - 1));
            case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
            default: return new Date(0); // all time
        }
    }

    async searchPost(keyword: string, page: number = 1, limit: number = 10) {
        const skip: number = (page - 1) * limit;
        const searchRegex = new RegExp(keyword, 'i');

        const listPost = await _Post.aggregate([
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
                $addFields: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } },
                    imageCount: { $ifNull: ['$imageCount', 0] },
                    videoCount: { $ifNull: ['$videoCount', 0] },
                    thumbnail: { $ifNull: ['$thumbnail', null] }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    createdAt: 1,
                    author: 1,
                    likeCount: 1,
                    commentCount: 1,
                    imageCount: 1,
                    videoCount: 1,
                    thumbnail: 1
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

        const userObjectId = userId ? new Types.ObjectId(userId) : null;

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
                {
                    $addFields: {
                        likeCount: { $size: { $ifNull: ['$react', []] } },
                        liked: userObjectId
                            ? { $in: [userObjectId, { $ifNull: ['$react', []] }] }
                            : false
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
                    $addFields: {
                        commentCount: { $size: { $ifNull: ['$comments', []] } },
                        imageCount: { $ifNull: ['$imageCount', 0] },
                        videoCount: { $ifNull: ['$videoCount', 0] },
                        thumbnail: { $ifNull: ['$thumbnail', null] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        createdAt: 1,
                        author: 1,
                        likeCount: 1,
                        commentCount: 1,
                        imageCount: 1,
                        videoCount: 1,
                        thumbnail: 1,
                        liked: 1
                    }
                }
            ]);

            // Sort by original similarity order
            const orderedPosts = similarPostIds.map((id: any) =>
                similarPosts.find((p: any) => p._id.toString() === id.toString())
            ).filter((p: any) => p);

            console.log(`✅ Found ${orderedPosts.length} similar posts for ${postId}`);
            return orderedPosts;

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
