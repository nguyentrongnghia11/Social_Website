import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/user';
import commentService from '../services/comment/comment.services';

class CommentController {
    async createComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { content, parentID } = req.body;
            const u = req.user as IUser;

            console.log('Creating comment for post:', id, 'by user:', u._id);

            const newComment = await commentService.createComment(id, content, u._id.toString(), parentID);

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
}

export default new CommentController();

