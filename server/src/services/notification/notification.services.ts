
import { Message, MulticastMessage } from "firebase-admin/lib/messaging/messaging-api";
import { admin } from "../../databases/connectFirebase"
import { ObjectId } from "mongoose";
import _User from '../../models/user'
import { INotification } from "../../models/notification";
import _Notifycation from '../../models/notification'
const sendNotifiCation = async (deviceToken: string, notice: INotification) => {


    const message: Message = {
        token: deviceToken,
        notification: {
            body: notice.message
        }
    }

    const noticee = await _Notifycation.create(notice)

    if (!noticee) {
        return null;
    }

    if (notice.type === 'system') {
        // all client 


    }
    else {
        // one client
    }
    try {
        const res = await admin.messaging().send(message)
        return res;
    } catch (error: any) {
        throw new Error(error);
    }
}

const sendEventDevice = async (notice: String, uid: string | ObjectId) => {

    const user = await _User.findById(uid).select({ tokenFcms: 1 }).lean();

    const tokenFcms: string[] | null = user && user.tokenFcms ? user.tokenFcms : null;

    if (!tokenFcms) {
        return null;
    }
    const message = {
        message: notice,
        tokens: tokenFcms
    }

    const response = await admin.messaging().sendEachForMulticast(message)
    if (!response) {
        return null
    }

    return response;
}


export { sendNotifiCation, sendEventDevice };