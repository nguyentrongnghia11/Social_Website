import { instance } from "../config"
import { isLoggedIn } from "../helpers/authHelper"

// Fetch notifications for a specific user id. If `id` is omitted,
// fall back to the currently logged-in user.
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
    const result = await instance.patch("/notification/mark-as-read", { notificationId, reciveId })
    return result
}