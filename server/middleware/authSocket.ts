import { Socket, ExtendedError } from 'socket.io';
import { NextFunction } from "express";
import getPublicKeyy from '../services/getPublicKey.services';
import * as cookies from 'cookie'
import jwt, { GetPublicKeyOrSecret, JwtPayload, PublicKey, Secret } from 'jsonwebtoken'
import redisClient from '../config/connectRedis';
import { getPublicKey } from '../services/handleKey.services';
import { JsonWebKeyInput, PublicKeyInput } from 'crypto';


// Define ExtendedError type for socket.io middleware error handling



export const authSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
    console.log('Socket auth :::', socket.id)

    try {
        const keyUserOnline = "user:online:";

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
            socket.user = user._id;
            await redisClient.SADD(`${keyUserOnline}${user._id}`, socket.id);
            return next();
        });

    } catch (error) {
        return next(new Error("Unauthorizeddd"));
    }
}