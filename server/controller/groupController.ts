import { NextFunction, Request, Response } from "express";
import { IUser } from "../modules/user";
import _Group from "../modules/group";
import _Conversation from "../modules/conversation";
import message from "../modules/message";


export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.user as IUser
    const { name, isPrivate, members } = req.body

    console.log({ name, isPrivate, members })


    if (!name || typeof isPrivate !== 'boolean' || !members) {
        console.log(1222222)
        return res.status(500).json({
            message: "information missing"
        })
    }

    const newGroup = await _Group.create({ userCreate: _id, name, isPrivate, members: [...members, _id] })

    if (!newGroup) {
        return res.status(500).json({
            message: "create group fail"
        })
    }

    const converstaion = {
        groupId: newGroup._id,
        type: "group"
    }

    const newConversation = await _Conversation.create(converstaion)
    console.log(1122)

    if (!newConversation) {
        return res.status(500).json({
            message: "Create conversation fail by group"
        })
    }

    return res.status(200).json({
        message: "create group success",
        result: { newGroup, newConversation }
    })

}


export const addMember = async (req: Request, res: Response, next: NextFunction) => {
    const { groupId } = req.params
    const { uid } = req.body

    if (!groupId || !uid) {
        return res.status(404).json({
            message: "groupId or uid is missing"
        })
    }

    const group = await _Group.findById(groupId);

    if (!group) {
        return res.status(404).json({
            message: "group not found"
        })
    }

    const newMember = await group.updateOne({ _id: groupId }, { $addToSet: { members: uid } }).lean()

    if (!newMember) {
        return res.status(500).json({
            message: "add member fail"
        })
    }

    return res.status(200).json({
        message: "add member success"
    })
}

const inviteMember = (req: Request, res: Response, next: NextFunction) => {

}