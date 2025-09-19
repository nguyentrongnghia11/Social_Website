import { IUser } from "../models/user";
import _Group from '../models/group'


export const buildJwtPayload = async (user: IUser, deviceId: string | string[]) => {

    const group = await _Group.find({ members: user._id }).select({ _id: 1 }).lean()
    return {
        _id: user._id,
        name: user.name,
        type: user.type,
        role: user.role,
        email: user.email,
        deviceId: deviceId,
        groups: group
    }
}