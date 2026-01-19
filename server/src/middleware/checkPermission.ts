import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user";
import { Permission } from "../enums/permission.enum";
import { role_permission } from "../enums/role-permission.map";
import message from "../models/message";
import { ErrorApi } from "./error";


const checkPermisson = (requiredPermission: Permission) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser;
        console.log("day la role ", user.role);

        if (!user.role) return next(new ErrorApi(401, "Unauthorized"));

        let userPermissions: string[] = [];

        if (user.permissions && user.permissions.length > 0) {
            userPermissions = user.permissions;
        } else {
            userPermissions = role_permission[user.role] || [];
        }

        console.log("User permissions: ", userPermissions);

        if (!userPermissions.includes(requiredPermission)) {
            return next(new ErrorApi(403, "Forbidden - Insufficient permissions"));
        }
        next();
    }
}

export { checkPermisson };