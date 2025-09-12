import { Types } from 'mongoose';
import { NextFunction, Request, Response } from 'express'
import { IUser } from '../models/user';
import _Comment, { IComment } from "../models/comment";
import GenericServices from '../services/GenericServices';
import _Post from "../models/post";

// const commentService = new GenericServices(_Comment)

class commentController {
    async createComment(req: Request, res: Response) {
        // const { params: { id: postId }, body: { content } } = req;

        const { id } = req.params;
        const { content, parentID } = req.body;

        console.log(id, ' ', content, ' ', parentID);


        const u = req.user as IUser
        const newComment = new _Comment({
            postId: id,
            content,
            userId: u._id,
            parentID,
            path: "abc"
        })

        const comment = await _Comment.create(newComment)

        // commentService.add(newComment)

        if (comment) {
            return res.json({
                status: 200,
                message: 'Create comment success',
                result: newComment
            })
        }

        return res.json({
            status: 500,
            message: 'Create comment faild',
            data: ""
        })
    }

    buildTree(comments: any[]) {
        const map = new Map<string, any>();
        const tree: any[] = [];
        comments.forEach((comment) => {

            console.log('commet ', typeof (comment._id))
            map.set(comment._id.toString(), { ...comment.toObject(), children: [] })
        })

        comments.forEach((comment) => {
            if (comment.parentID !== null) {
                console.log('parent', typeof (comment.parentID))
                map.get(comment.parentID.toString()).children.push(map.get(comment._id.toString()))
            }
            else {
                tree.push(map.get(comment._id.toString()))
            }
        })
        return tree;
    }

    async getComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;

        const comments = await _Comment.findWithDeleted({ postId: id })
        console.log(this)

        const tree = this.buildTree(comments)

        return res.json({
            message: 'Get comment success',
            result: tree
        })
    }

    async updateComment(req: Request, res: Response, next: NextFunction) {
        const { id, content } = req.body;

        const data = await _Comment.findByIdAndUpdate(id, content)

        console.log(data)


        if (!data) {
            return res.json({
                status: 400,
                message: "Update comment fail"
            })
        }

        return res.json({
            status: 200,
            message: "Update comment success",
            result: data
        })
    }

    async removeComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        const findComment = await _Comment.findOne(id);

        if (!findComment) {
            return res.status(404).json({
                message: 'Comment not found'
            })
        }

        const comment = await _Comment.deleteById(id);
        if (comment ) {
            return res.status(500).json({
                message: 'Comment not found'
            })
        }
        
    }
}


export default new commentController();



//Request<Params = {}, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs>
//Response<ResBody = any, Locals = Record<string, any>>

