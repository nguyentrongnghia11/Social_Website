import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user";
import groupService from "../services/group/group.services";

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { _id } = req.user as IUser;
        const { name, isPrivate, members } = req.body;

        const result = await groupService.createGroup(_id.toString(), name, isPrivate, members);
        return res.status(200).json({
            message: "create group success",
            result
        });
    } catch (error) {
        next(error);
    }
}

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { uid } = req.body;

        await groupService.addMember(groupId, uid);

        return res.status(200).json({
            message: "Add member success"
        });
    } catch (error) {
        next(error);
    }
}

const inviteMember = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { uid } = req.body;

        groupService.inviteMember(groupId, uid);

        return res.status(200).json({
            message: "Invite member success"
        });
    } catch (error) {
        next(error);
    }
}
