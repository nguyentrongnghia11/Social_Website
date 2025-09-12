import { Socket, ExtendedError } from 'socket.io';
import { NextFunction } from "express";
import getPublicKeyy from '../services/getPublicKey.services';
import * as cookies from 'cookie'
import jwt, { GetPublicKeyOrSecret, JwtPayload, PublicKey, Secret } from 'jsonwebtoken'
import redisClient from '../databases/connectRedis';
import { getPublicKey } from '../services/handleKey.services';
import { JsonWebKeyInput, PublicKeyInput } from 'crypto';
import { redis } from 'googleapis/build/src/apis/redis';
import { json } from 'stream/consumers';


// Define ExtendedError type for socket.io middleware error handling


const joinGroup = (uid: string) => {

}

export const authSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
    console.log('Socket auth :::', socket.id)

    try {
        const keyUserOnline = "USER-ONLINE-SOCKET-";

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

        if (!key) {
            return next(new Error("Unauthorizeddd"));
        }

        jwt.verify(token.accessToken, key, async (err: any, user: any) => {
            if (err || !user) {
                return next(new Error("Unauthorizeddd"));
            }


            console.log("user socker ", user)
            const uid: string = user?._id;



            const user_online = await redisClient.get(`${keyUserOnline}-${uid}`)


            if (!user_online) {
                console.log("user khong ton tai ", user_online)
                return;
            }

            const { payload, groups } = JSON.parse(user_online)

           
            await redisClient.sAdd(`${keyUserOnline}${uid}`, socket.id)
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