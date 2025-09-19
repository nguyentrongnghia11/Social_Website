import redisClient from "../../databases/connectRedis"
export const saveUserCache = async (user: any, publicKey: string) => {
    await redisClient.set(`USER-PUBLICKEY-${user.email}-${user.deviceId}`, publicKey)
    await redisClient.set(`USER-ONLINE-${user._id}`, JSON.stringify(user), { EX: 900000 })
}

export const delUserCache = async (user: any) => {
    await Promise.all([redisClient.del(`USER-PUBLICKEY-${user.email}-${user.deviceId}`),
    redisClient.del(`USER-ONLINE-${user._id}`)])
}