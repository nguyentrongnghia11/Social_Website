import { instance } from "../config"
import { isLoggedIn } from "../helpers/authHelper"

export const getNotifications = async (id) => {
    const userAuth = isLoggedIn();
    const userId = id || userAuth?.user?._id || userAuth?._id;
    if (!userId) {
        throw new Error("Missing user id for getNotifications")
    }
    const result = await instance.get(`/notifications/user/${userId}`)
    return result;
}

export const markAsRead = async (notificationId, reciveId) => {
    const result = await instance.patch("/notifications/mark-as-read", { notificationId, reciveId })
    return result
}

export const markAllAsRead = async (receiverId) => {
    const result = await instance.patch("/notifications/mark-all-as-read", { receiverId })
    return result
}