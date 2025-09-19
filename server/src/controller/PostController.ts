import { IUser } from '../models/user';
import _Post from '../models/post'
import _Comment from '../models/comment'
import { NextFunction, Request, Response, } from 'express'
import redisClient from '../databases/connectRedis';
import { Types } from 'mongoose';
import { uploadProducer } from '../services/queue/uploadProducer.services';
import { title } from 'process';
import { ErrorApi } from '../middleware/error';


class PostController {
    // [GET] /playlist
    async createPost(req: Request, res: Response, next: NextFunction) {
        const { title, content } = req.body;
        const user = req.user as IUser;

        const newPost = await _Post.create({
            title,
            artistId: user._id,
            content,
        })

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const imageFiles = files["image"] || [];
        const videoFiles = files["video"] || [];



        const path = [...imageFiles, ...videoFiles].map(file => file.path);

        if (path.length > 0) {
            const listPath = {
                uid: user._id,
                postId: newPost._id,
                paths: path
            }
            try {
                await uploadProducer(JSON.stringify(listPath));
            } catch (error) {
                console.error('Lỗi khi gửi message lên queue:', error);
            }
        }

        return res.status(200).json({
            message: 'create post success',
            result: newPost
        })
    }

    async updatePost(req: Request, res: Response, next: NextFunction) {
        const postId = req.params.id;
        const { title, imgUrl, content } = req.body;


        const post = await _Post.findOneAndUpdate({ _id: postId }, { title, imgUrl, content }, { new: true })


        if (!post) return next(new ErrorApi(400, "GroupId or uid is missing"))


        return res.json({
            status: 200,
            message: 'Add song to playlist success',
            data: post
        })

    }


    async getPost(req: Request, res: Response) {

        const postId = req.params.id;

        const post = await _Post.aggregate([
            {
                $match: { _id: new Types.ObjectId(postId) }

            }
            ,
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },


            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',         // post._id
                    foreignField: 'postId',    // comments.postId
                    as: 'comments'
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
                    imgUrl: 1,
                    vidUrl: 1,
                    commentCount: 1,
                    createdAt: 1
                }
            }
        ]);
        return res.json({
            status: 200,
            message: 'Get all post success',
            result: post
        })

    }

    async hiddenPost(req: Request, res: Response, next: NextFunction) {
        const postId = req.params.id;
        const accountId = req.user; // .id 

        console.log(postId)

        const post = await _Post.deleteOne({ _id: postId }, accountId);

        if (!post) {
            return res.json({
                status: 404,
                message: 'Delete post faild'
            })
        }
        return res.json({
            status: 400,
            message: 'success 84'
        })
    }

    async removePost(req: Request, res: Response, next: NextFunction) {

        // const postId = req.params.id;
        // const accountId = req.user.id;

        // console.log(postId)

        // const post = await _Post.deleteOne({ _id: postId }, accountId);

        // if (!post) {
        //     return res.json({
        //         status: 404,
        //         message: 'Delete post faild'
        //     })
        // }
        // return res.json({
        //     status: 400,
        //     message: 'success 84'
        // })
    }

    async reactPost(req: Request, res: Response, next: NextFunction) {
        const { _id } = req.user as IUser;
        const { postID } = req.body;

        const post = await _Post.findOne(postID);
        if (!post) return next(new ErrorApi(404, "Post not found"))

        // //check cooldown 

        // const keyCooldown = `cooldown:post:like:${postID}`
        const keyPostLike = `post:like:${postID}`

        // const isCoolDown = await redisClient.get(keyCooldown);
        // if (isCoolDown) {
        //     return res.json({
        //         status: 429,
        //         message: 'Fast request'
        //     })
        // }


        // await redisClient.set(keyCooldown.toString(), 1, { "EX": 2 });

        const liked = await redisClient.SISMEMBER(`${keyPostLike}`, _id.toString());
        if (liked) {
            await redisClient.SREM(keyPostLike, _id.toString());
            return res.json({
                status: 200,
                message: 'Unliked post',
                liked: false
            })
        }
        else redisClient.sAdd(keyPostLike, _id.toString());
        return res.json({
            status: 200,
            message: 'Like post success',
            liked: true
        })
    }

    async moderationPost(req: Request, res: Response, next: NextFunction) {
        // const postId = req.params.id;
        // const admin = req.user.role;



        // if (admin !== 'admin') {
        //     return res.json({
        //         status: 403,
        //         message: 'Permission denied'
        //     })
        // }


        // const post = await _Post.findByIdAndUpdate({ _id: postId }, { status: 1 });

        // if (!post) {
        //     return res.json({
        //         status: 400,
        //         message: 'Moderation faild'
        //     })
        // }

        // return res.json({
        //     status: 200,
        //     message: 'Moderation success'
        // })

    }

    // async restorePost() {
    //     const postId = req.params.id;
    //     const admin = req.user.id;

    //     const author = _Post.findById({ _id: postId }).select('artistId');

    //     if (admin !== author) {
    //         return res.json({
    //             status: 403,
    //             message: 'Permission denied'
    //         })
    //     }

    //     const post = await _Post.restore({ _id: postId });

    //     if (!post) {
    //         return res.json({
    //             status: 400,
    //             message: 'Restore faild'
    //         })
    //     }

    //     return res.json({
    //         status: 200,
    //         message: 'Restore success'
    //     })


    // }


    async getAllPost(req: Request, res: Response, next: NextFunction) {

        const page: number = parseInt(req.query.page as string) || 1
        const limit: number = parseInt(req.query.limit as string) || 10;
        const skip: number = (page - 1) * limit;
        const sortt: string = req.query.sortBy as string || '-createdAt'

        const listPost = await _Post.aggregate([
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',         // post._id
                    foreignField: 'postId',    // comments.postId
                    as: 'comments'
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
                    imgUrl: 1,
                    createdAt: 1
                }
            }, {
                $sort: {
                    createdAt: -1
                }
            }, {
                $skip: skip
            }
            , {
                $limit: limit
            }
        ]);

        return res.json({
            status: 200,
            message: 'Get all post success',
            data: listPost
        })

    }


    async getPostLikedOfUser(req: Request, res: Response, next: NextFunction) {
        const user = req.user as IUser

        const listPost = await _Post.aggregate([
            {
                $match: { react: { $in: [user._id] } }

            }
            ,
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },


            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',         // post._id
                    foreignField: 'postId',    // comments.postId
                    as: 'comments'
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
                    createdAt: 1
                }
            }
        ]);

        return res.json({
            status: 200,
            message: 'Get all post success',
            data: listPost
        })

    }

    async getPostUserCommented(req: Request, res: Response, next: NextFunction) {
        console.log('getpostcommented')
        const user = req.user as IUser
        const listPost = await _Comment.aggregate([{
            $match: {
                userId: user._id
            }
        }, { $group: { _id: '$postId', comments: { $push: '$_id' }, userIds: { $addToSet: '$userId' } } },
        { $addFields: { commentCount: { $size: '$comments' } } },
        { $lookup: { from: 'posts', localField: '_id', foreignField: '_id', as: 'post' } },
        { $addFields: { 'likeCount': { $size: '$post.react' } } },
        { $unwind: '$post' }, { $project: { _id: 0, comments: 0 } }])

        if (!listPost) {
            return res.json({
                status: 204,
                message: 'Post not found',
            })
        }

        return res.json({
            status: 200,
            message: 'Get all post success',
            data: listPost
        })

    }

    async getPostOfUser(req: Request, res: Response, next: NextFunction) {
        const user = req.user as IUser


        console.log(user._id)

        const listPost = await _Post.aggregate([
            {
                $match: { artistId: user._id }
            }
            ,
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$react', []] } }
                }
            },


            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',         // post._id
                    foreignField: 'postId',    // comments.postId
                    as: 'comments'
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
                    createdAt: 1
                }
            }
        ]);

        if (!listPost) {
            return res.json({
                status: 204,
                message: 'Post not found',
            })
        }

        return res.json({
            status: 200,
            message: 'Get all post success',
            data: listPost
        })

    }


    async getMyPost(req: Request, res: Response, next: NextFunction) {
        const {_id}= req.user as IUser;

        const post = await _Post.find({ artistId: _id}).populate('artistId').populate('comments').sort({ createdAt: -1 });

        return res.json({
            status: 200,
            message: 'Get my post success',
            data: post
        })

    }

}

export default new PostController();