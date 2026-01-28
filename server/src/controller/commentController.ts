import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/user';
import commentService from '../services/comment/comment.services';
import { ErrorApi } from '../middleware/error';

class CommentController {
    async uploadCommentImage(req: Request, res: Response, next: NextFunction) {
        try {
            const file = req.file;

            if (!file) {
                throw new ErrorApi(400, 'No image file provided');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `comment_${timestamp}_${randomString}.${fileExtension}`;

            // Upload to S3
            const { uploadToS3 } = await import('../services/storage/s3.service');
            const result = await uploadToS3(
                file.buffer,
                fileName,
                file.mimetype,
                'comments'
            );

            res.json({
                status: 200,
                message: 'Comment image uploaded successfully',
                data: {
                    url: result.url,
                    key: result.key
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async createComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { content, parentID, imageUrl } = req.body;
            const u = req.user as IUser;

            console.log('Creating comment for post:', id, 'by user:', u._id);

            const newComment = await commentService.createComment(id, content, u._id.toString(), parentID, imageUrl);

            return res.json({
                status: 200,
                message: 'Create comment success',
                result: newComment
            });
        } catch (error) {
            next(error);
        }
    }

    async getComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const tree = await commentService.getComment(id);

            return res.json({
                message: 'Get comment success',
                result: tree
            });
        } catch (error) {
            next(error);
        }
    }

    async updateComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id, content } = req.body;

            const data = await commentService.updateComment(id, content);

            return res.json({
                status: 200,
                message: "Update comment success",
                result: data
            });
        } catch (error) {
            next(error);
        }
    }

    async removeComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.body;

            await commentService.removeComment(id);

            return res.status(200).json({
                message: 'Delete comment success'
            });
        } catch (error) {
            next(error);
        }
    }

    async hideComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = req.user as IUser;

            // Check if user has hide_comment permission
            const hasPermission = user.permissions?.includes('hide_comment') || user.role === 'admin';
            if (!hasPermission) {
                return res.status(403).json({
                    status: 403,
                    message: 'Bạn không có quyền ẩn bình luận'
                });
            }

            await commentService.setCommentVisibility(id, false);

            return res.json({
                status: 200,
                message: 'Đã ẩn bình luận thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async unhideComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = req.user as IUser;

            // Check if user has hide_comment permission
            const hasPermission = user.permissions?.includes('hide_comment') || user.role === 'admin';
            if (!hasPermission) {
                return res.status(403).json({
                    status: 403,
                    message: 'Bạn không có quyền hiện bình luận'
                });
            }

            await commentService.setCommentVisibility(id, true);

            return res.json({
                status: 200,
                message: 'Đã hiện bình luận thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new CommentController();

