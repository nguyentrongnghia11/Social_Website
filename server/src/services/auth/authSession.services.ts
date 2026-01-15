import redisClient from "../../databases/connectRedis"
export const saveUserCache = async (user: any, publicKey: string) => {
    console.log('💾 Saving user cache:', {
        userId: user._id,
        email: user.email,
        deviceId: user.deviceId,
        publicKeyPrefix: publicKey.substring(0, 50) + '...'
    });
    await redisClient.set(`USER-PUBLICKEY-${user.email}-${user.deviceId}`, publicKey)
    await redisClient.set(`USER-ONLINE-${user._id}`, JSON.stringify(user), { EX: 900000 })
}

export const delUserCache = async (user: any) => {
    await Promise.all([redisClient.del(`USER-PUBLICKEY-${user.email}-${user.deviceId}`),
    redisClient.del(`USER-ONLINE-${user._id}`)])
}