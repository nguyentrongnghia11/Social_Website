import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user";
import { Permission } from "../enums/permission.enum";
import { role_permission } from "../enums/role-permission.map";
import message from "../models/message";
import { ErrorApi } from "./error";


const checkPermisson = (requiredPermission: Permission) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { role } = req.user as IUser
        console.log("day la role ", role)
        if (!role) return next(new ErrorApi(401, "Unauthorized"))

        const permission = role_permission[role] || []
        if (!permission.includes(requiredPermission)) {
            return next(new ErrorApi(404, "Forbiden role"))
        }
        next()
    }
}

export { checkPermisson };