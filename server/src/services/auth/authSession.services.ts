import redisClient from "../../databases/connectRedis"
import { IUser } from "../../models/user"


export const saveUserCache = (user: any, publicKey: string) => {
    redisClient.set(`USER-PUBLICKEY-${user.email}-${user.deviceId}`, publicKey, { EX: 20 })
    redisClient.set(`USER-ONLINE-${user._id}`, JSON.stringify(user), { EX: 20 })
}

export const delUserCache = async (user: any) => {
    await Promise.all([redisClient.del(`USER-PUBLICKEY-${user.email}-${user.deviceId}`),
    redisClient.del(`USER-ONLINE-${user._id}`)])
}