import _Post from '../../models/post';
import _Comment from '../../models/comment';
import _File from '../../models/file';
import { Types } from 'mongoose';
import { ErrorApi } from '../../middleware/error';
import redisClient from '../../databases/connectRedis';
import cloudinary from '../../databases/cloud';
import { uploadProducer } from '../queue/uploadProducer.services';
import { encodePostProducer } from '../queue/encodePostProducer.services';
import { handleNotification } from '../notification/handleNotification.services';
import _User from '../../models/user';

/**
 * Helper: Add standard post fields (liked, userLikePreview, edited, status)
 */
const addStandardPostFields = (posts: any[], userId?: string): any[] => {
    const userObjectId = userId ? new Types.ObjectId(userId) : null;

    return posts.map(post => {
        // Check if user liked this post
        let liked = false;

        if (userObjectId && post.react && Array.isArray(post.react)) {
            liked = post.react.some((reactUserId: any) => {

                console.log('Comparing reactUserId:', reactUserId.toString(), 'with userObjectId:', userObjectId.toString());
                return reactUserId.toString() === userObjectId.toString();
            });
        }

        // Get first 3 users who liked (for avatar preview)
        const userLikePreview = post.reactUsers?.slice(0, 3).map((u: any) => ({
            _id: u._id,
            username: u.name
        })) || [];

        // Check if post was edited
        const edited = post.updatedAt && post.createdAt
            ? new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000
            : false;

        // Remove react array from response
        delete post.react;
        delete post.reactUsers;

        return {
            ...post,
            liked,
            userLikePreview,
            edited,
            status: post.status || 'active'
        };
    });
};

export class PostService {
    async createPost(title: string, content: string, userId: string, files: Express.Multer.File[]) {
        const newPost = await _Post.create({
            title,
            artistId: userId,
            content,
        });

        if (files.length > 0) {
            const listPath = {
                uid: userId,
                postId: newPost._id,
                paths: files.map(file => file.path)
            };
            await uploadProducer(JSON.stringify(listPath));
        }

        return newPost;
    }

    async grantPermissionUploadFile(typeImg: string, title: string, content: string, userId: string) {
        if (!typeImg) {
            throw new ErrorApi(400, "Type image missing");
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = typeImg === "avatar" ? "avatar" : "upload";

        const signature = await cloudinary.utils.api_sign_request(
            { timestamp, folder },
            cloudinary.config().api_secret
        );

        if (!signature) {
            throw new ErrorApi(500, "Grant permission fail");
        }

        const post_draft = await _Post.create({ title, artistId: userId, content });

        if (!post_draft) {
            throw new ErrorApi(500, "Create post draft fail");
        }

        await encodePostProducer(post_draft);

        const information: {
            api_key: string;
            timestamp: number;
            signature: string;
            folder: string;
            tags: string;
            eager?: Array<{ width: number; height: number; crop: string }>;
            cloud_name: string;
            postId: string;
        } = {
            api_key: cloudinary.config().api_key,
            timestamp,
            signature,
            folder,
            tags: post_draft._id as string,
            cloud_name: cloudinary.config().cloud_name,
            postId: post_draft._id as string
        };

        if (typeImg === "avatar") {
            information.eager = [{ width: 150, height: 150, crop: "thumb" }];
        }

        return information;
    }

    async grantPermissionForUpdatePost(postId: string, typeImg: string, userId: string) {
        if (!postId) {
            throw new ErrorApi(400, "Post ID missing");
        }

        if (!typeImg) {
            throw new ErrorApi(400, "Type image missing");
        }

        // Kiểm tra post có tồn tại và user có quyền update không
        const post = await _Post.findOne({ _id: postId, artistId: userId });

        if (!post) {
            throw new ErrorApi(404, "Post not found or you don't have permission");
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = typeImg === "avatar" ? "avatar" : "upload";

        const signature = await cloudinary.utils.api_sign_request(
            { timestamp, folder },
            cloudinary.config().api_secret
        );

        if (!signature) {
            throw new ErrorApi(500, "Grant permission fail");
        }

        const information: {
            api_key: string;
            timestamp: number;
            signature: string;
            folder: string;
            tags: string;
            eager?: Array<{ width: number; height: number; crop: string }>;
            cloud_name: string;
            postId: string;
        } = {
            api_key: cloudinary.config().api_key,
            timestamp,
            signature,
            folder,
            tags: postId,
            cloud_name: cloudinary.config().cloud_name,
            postId: postId
        };

        if (typeImg === "avatar") {
            information.eager = [{ width: 150, height: 150, crop: "thumb" }];
        }

        return information;
    }

    async updateFile(listFile: any[], postId: string) {
        if (!Array.isArray(listFile) || listFile.length === 0) {
            throw new ErrorApi(400, "Danh sách file trống hoặc không hợp lệ");
        }

        const fileDocs = listFile.map(f => ({
            public_id: f.public_id,
            width: f.width,
            height: f.height,
            format: f.format,
            created_at: f.created_at,
            resource_type: f.resource_type,
            tags: f.tags || [],
            bytes: f.bytes,
            secure_url: f.secure_url,
            folder: f.asset_folder,
            postId: postId || null,
        }));

        await _File.insertMany(fileDocs);

        return { count: fileDocs.length };
    }

    async updatePost(postId: string, title: string, content: string, userId: string, files?: any[]) {
        console.log("checked 1");

        // Kiểm tra post có tồn tại và user có phải tác giả không
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
                // Handle both string URLs and full Cloudinary objects
                const fileDocs = files
                    .map(f => {
                        // If it's already a Cloudinary object with secure_url
                        if (typeof f === 'object' && f.secure_url) {
                            return {
                                public_id: f.public_id,
                                width: f.width,
                                height: f.height,
                                format: f.format,
                                created_at: f.created_at,
                                resource_type: f.resource_type,
                                tags: f.tags || [],
                                bytes: f.bytes,
                                secure_url: f.secure_url,
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
        console.log("Getting post with ID:", postId, "for user ID:", userId);
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

        const processedPosts = addStandardPostFields(post, userId);
        return processedPosts[0]; // Return single post object, not array
    }

    async hiddenPost(postId: string, accountId: string) {
        const post = await _Post.deleteOne({ _id: postId, artistId: accountId });

        if (!post.deletedCount) {
            throw new ErrorApi(404, 'Delete post failed - Post not found or unauthorized');
        }

        return { success: true };
    }

    async reactPost(userId: string, postID: string) {
        const post = await _Post.findById(postID);
        if (!post) {
            throw new ErrorApi(404, "Post not found");
        }

        const userObjectId = new Types.ObjectId(userId);
        const isLiked = post.react?.includes(userObjectId);

        if (isLiked) {
            // Unlike: remove user from react array
            await _Post.findByIdAndUpdate(
                postID,
                { $pull: { react: userObjectId } },
                { new: true }
            );
            return { liked: false };
        }

        // Like: add user to react array
        await _Post.findByIdAndUpdate(
            postID,
            { $addToSet: { react: userObjectId } },
            { new: true }
        );

        // Send notification to post owner
        if (post.artistId.toString() !== userId) {
            const user = await _User.findById(userId).select('name');

            await handleNotification({
                message: `${user?.name || 'Someone'} đã thích bài viết của bạn`,
                title: 'Lượt thích mới',
                receiver: post.artistId,
                sender: userObjectId,
                type: 'like',
                read: false,
                link: `/post/${postID}`,
                postId: new Types.ObjectId(postID)
            } as any);
        }

        return { liked: true };
    }

    async getAllPost(page: number = 1, limit: number = 10, sortBy: string = 'latest', userId?: string) {
        const skip: number = (page - 1) * limit;

        // Determine sort criteria based on sortBy parameter
        let sortCriteria: any = { createdAt: -1 }; // default: latest

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
                    imgUrl: '$files.secure_url',
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

        return addStandardPostFields(listPost, userId);
    }


    async removePost(postId: string) {
        console.log ("Removing post with ID:", postId);
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
}

export default new PostService();
