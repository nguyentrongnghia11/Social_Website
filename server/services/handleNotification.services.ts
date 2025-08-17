import redisClient from "../config/connectRedis";
import _Notification, { INotification } from "../modules/notification";
import { sendEventDevice } from "./notification.services";
import { io } from "..";
export async function handleNotification(notice: INotification) {
    const keyUserOnline = "user:online:";
    const notif = await _Notification.create(notice);
    if (!notif) return;

    const list = await redisClient.sMembers(`${keyUserOnline}${notif.receiver}`);
    for (const socketId of list) {
        io.to(socketId).emit(notif.type, notif);
    }

    const respone = await sendEventDevice(notif.message, notif.receiver);
    console.log(respone ? "Notification success" : "Notification failed");
}
