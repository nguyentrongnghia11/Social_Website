import { IUser } from '../models/user';
import { NextFunction, Request, Response } from 'express';
import postService from '../services/post/post.services';

class PostController {
    async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, content } = req.body;
            const user = req.user as IUser;

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const imageFiles = files["image"] || [];
            const videoFiles = files["video"] || [];
            const allFiles = [...imageFiles, ...videoFiles];

            const newPost = await postService.createPost(title, content, user._id.toString(), allFiles);

            return res.status(200).json({
                message: 'create post success',
                result: newPost
            });
        } catch (error) {
            next(error);
        }
    }

    async grantPermissionUploadFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { typeImg, title, content } = req.body;
            const { _id } = req.user as IUser;

            const information = await postService.grantPermissionUploadFile(typeImg, title, content, _id.toString());

            return res.status(200).json({
                message: "Grant permission success",
                data: information
            });
        } catch (error) {
            next(error);
        }
    }

    async updateFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { listFile, postId } = req.body;

            const result = await postService.updateFile(listFile, postId);

            return res.status(200).json({
                message: "Upload success",
                count: result.count
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePost(req: Request, res: Response, next: NextFunction) {
        try {
            const postId = req.params.id;
            const { title, content, files } = req.body;

            console.log("Updating post with files: ", files);

            const post = await postService.updatePost(postId, title, content, files);

            return res.json({
                status: 200,
                message: 'Update post success',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async getPost(req: Request, res: Response, next: NextFunction) {
        try {
            const postId = req.params.id;
            const user = req.user as IUser;
            const userId = user?._id?.toString();

            console.log ("Getting post with ID: ", postId, " for user ID: ", user);

            const post = await postService.getPost(postId, userId);

            return res.json({
                status: 200,
                message: 'Get post success',
                result: post
            });
        } catch (error) {
            next(error);
        }
    }

    async hiddenPost(req: Request, res: Response, next: NextFunction) {
        try {
            const postId = req.params.id;
            const accountId = (req.user as IUser)._id.toString();

            await postService.hiddenPost(postId, accountId);

            return res.json({
                status: 200,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async removePost(req: Request, res: Response, next: NextFunction) {
        return res.status(501).json({
            message: 'Not implemented'
        });
    }

    async reactPost(req: Request, res: Response, next: NextFunction) {
        try {
            const { _id } = req.user as IUser;
            const { postID } = req.body;

            const result = await postService.reactPost(_id.toString(), postID);

            return res.json({
                status: 200,
                message: result.liked ? 'Like post success' : 'Unliked post',
                liked: result.liked
            });
        } catch (error) {
            next(error);
        }
    }

    async moderationPost(req: Request, res: Response, next: NextFunction) {
        return res.status(501).json({
            message: 'Not implemented'
        });
    }

    async getAllPost(req: Request, res: Response, next: NextFunction) {
        try {
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;
            const sortBy: string = req.query.sortBy as string || '-createdAt';
            const user = req.user as IUser;
            const userId = user?._id?.toString();

            const listPost = await postService.getAllPost(page, limit, sortBy, userId);

            return res.json({
                status: 200,
                message: 'Get all post success',
                data: listPost
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostLikedOfUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;

            const listPost = await postService.getPostLikedOfUser(user._id.toString());

            return res.json({
                status: 200,
                message: 'Get all post success',
                data: listPost
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostUserCommented(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;

            const listPost = await postService.getPostUserCommented(user._id.toString());

            return res.json({
                status: 200,
                message: 'Get all post success',
                data: listPost
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostOfUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;

            const listPost = await postService.getPostOfUser(user._id.toString());

            return res.json({
                status: 200,
                message: 'Get all post success',
                data: listPost
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyPost(req: Request, res: Response, next: NextFunction) {
        try {
            const { _id } = req.user as IUser;

            const post = await postService.getMyPost(_id.toString());

            return res.json({
                status: 200,
                message: 'Get my post success',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async getTopPost(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const period = (req.query.period as string) || 'week';

            const result = await postService.getTopPost(limit, period);

            return res.status(200).json({
                message: 'Get top post success',
                result
            });
        } catch (error) {
            next(error);
        }
    }

    async searchPost(req: Request, res: Response, next: NextFunction) {
        try {
            const keyword = req.query.q as string;
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            if (!keyword || keyword.trim() === '') {
                return res.status(400).json({
                    status: 400,
                    message: 'Keyword is required'
                });
            }

            const result = await postService.searchPost(keyword, page, limit);

            return res.json({
                status: 200,
                message: 'Search post success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new PostController();
