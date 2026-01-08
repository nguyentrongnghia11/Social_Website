import { IUser } from "../models/user";
import { Request, Response, NextFunction } from "express";
import messageService from '../services/message/message.services';

const getAllConventionOfUser = async (req: Request, res: Response, next: NextFunction) => {
    console.log ("123")
    try {
        const user = req.user as IUser;
        const listConversation = await messageService.getAllConversationsOfUser(user._id.toString());

        console.log("listConversation ", listConversation);
        return res.status(200).json({
            message: 'List of all conversations of user',
            result: listConversation
        });
    } catch (error) {
        next(error);
    }
}

const getMessageOfUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversationId = req.params.id;
        const page: number = parseInt(req.query.page as string) || 1;
        const limit: number = parseInt(req.query.limit as string) || 50;

        const result = await messageService.getMessagesOfConversation(conversationId, page, limit);

        return res.status(200).json({
            message: 'List of all messages of user',
            data: result.messages,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
}

const markMessagesAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IUser;
        const conversationId = req.params.id;

        const result = await messageService.markMessagesAsRead(conversationId, user._id.toString());

        return res.status(200).json({
            message: 'Messages marked as read',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export { getAllConventionOfUser, getMessageOfUser, markMessagesAsRead };
