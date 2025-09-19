import { Socket, ExtendedError } from 'socket.io';
import { NextFunction } from "express";
import * as cookies from 'cookie'
import jwt, { GetPublicKeyOrSecret, JwtPayload, PublicKey, Secret } from 'jsonwebtoken'
import redisClient from '../databases/connectRedis';
import { getPublicKey } from '../services/auth/handlePublicKey.services';


export const authSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
        const keyUserOnline = "USER-ONLINE-";
        const keyUserOnlineSocket = "USER-ONLINE-SOCKET-";

        const cookieHeader: string | string[] | undefined = socket.handshake.headers.cookie;


        if (!cookieHeader) {
            return next(new Error("Unauthorizeddd"));
        }

        const token: any = cookies.parse(cookieHeader);

        const infor: null | JwtPayload = jwt.decode(token.accessToken, { json: true });
        if (!infor) {
            return next(new Error("Unauthorizeddd"));

        }
        const key: Secret = await getPublicKey(infor.email, infor.deviceId) as Secret;
        console.log("key ", key)

        if (!key) {
            return next(new Error("Unauthorizeddd"));
        }

        jwt.verify(token.accessToken, key, async (err: any, user: any) => {
            if (err || !user) {
                return next(new Error("Unauthorizeddd"));
            }

            const uid: string = user?._id;
            const user_online = await redisClient.get(`${keyUserOnline}${uid}`)
            console.log("user online ", user_online, "  uid ", uid)
            if (!user_online) {
                return;
            }
            const { groups, ...payload } = JSON.parse(user_online)

            console.log(payload)
            await redisClient.sAdd(`${keyUserOnlineSocket}${uid}`, socket.id)
            socket.user = { id: payload._id, groups }

            socket.join(groups.map((gid: any) => gid._id))

            for (const groupId of groups) {
                await redisClient.sAdd(`GROUP:${groupId._id}`, socket.id)
            }
            return next();
        });

    } catch (error) {
        return next(new Error("Unauthorizeddd"));
    }
}