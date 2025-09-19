import { IUser } from "../models/user";
import { Request, Response } from "express";
import _Conversation from '../models/conversation'
import _Message from "../models/message";
import { Types } from "mongoose";

const getAllConventionOfUser = async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const userId = new Types.ObjectId(user._id);
    const listConvenstation = await _Conversation.find({
        $or: [
            // Private chat
            { senderId: userId },
            { receiverId: userId },
            // Group chat
            { groupId: { $exists: true, $ne: null } }
        ]
    })
        .populate({
            path: 'groupId',
            select: { members: 1, name: 1 },
            match: { members: userId }
        })
        .populate([
            { path: 'senderId', select: 'email _id name' },
            { path: 'receiverId', select: 'email _id name' }
        ])

        .select({ __v: 0 })
        .sort({ updatedAt: -1 })
        .lean();

    return res.status(200).json({
        message: 'List of all conversations of user',
        result: listConvenstation
    })
}

const getMessageOfUser = async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const convervation_id = req.params.id;

    console.log(convervation_id)

    const messages = await _Message.find({ conversationId: convervation_id }).sort({ createdAt: -1 }).lean()
    return res.status(200).json({
        message: 'List of all messages of user',
        result: messages

    })

}

export { getAllConventionOfUser, getMessageOfUser }