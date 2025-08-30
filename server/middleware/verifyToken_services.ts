import { Request, Response, NextFunction } from 'express'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import User from '../modules/user'
import jwt, { JwtPayload } from 'jsonwebtoken';
import _Token from '../modules/token';
import redisClient from '../config/connectRedis';

import { redis } from 'googleapis/build/src/apis/redis';
import { getPublicKey } from '../services/handleKey.services';

export const authenticateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: true }, (err: any, user: unknown, info: unknown) => {

        if (err) {
            return res.status(401).json({ message: err.message });
        }
        else if (!user) {
            return res.status(401).json({ message: 'Unauthorized', code: 'Token expired' });
        }
        else {
            req.user = user;
            next();
        }

    })(req, res, next);
}

const p = (app: any) => {
    // Use the correct type for options to avoid type errors
    // import { StrategyOptions } from 'passport-jwt'; at the top if you want stricter typing

    var opts: any = {}
    var cookieExtractor = function (req: Request, res: Response) {

        var token = null;
        if (req && req.cookies) {
            token = req.cookies['accessToken'];
        }
        return token;
    };
    opts.jwtFromRequest = cookieExtractor;
    // nhận token 
    opts.secretOrKeyProvider = async (req: Request, token: string, done: any) => {
        try {
            const decoded: JwtPayload | null = jwt.decode(token, { json: true });

            if (!decoded) {
                return done(null, false, { message: 'Invalid token' });
            }
            const { email, deviceId, _id } = decoded as JwtPayload

            if (!email || !deviceId) {
                return done(null, false, { message: 'Invalid token' });
            }

            const timeCreateToken = decoded?.iat
            const timeLogout: string | null = await redisClient.get(`TOKEN-AVAILABLE-${email}-${deviceId}`);
            const timeLogutAllDevice: string | null = await redisClient.get(`TOKEN-AVAILABLE-${email}-${deviceId}`)
            if (timeCreateToken) {

                if ((timeLogout && timeCreateToken < parseInt(timeLogout)) || timeLogutAllDevice && timeCreateToken < parseInt(timeLogutAllDevice)) {
                    return done(null, false, { message: 'Token đã bị thu hồi' });
                }
            }

            const publicKey = await getPublicKey(email as string, deviceId as string);

            return done(null, publicKey);
        } catch (error: any) {
            console.error('Lỗi khi lấy secret key:', error.message);
            return done(error, null);
        }
    };

    passport.use(new JwtStrategy(opts, async function (jwt_payload: JwtPayload, done: any) {
        try {
            const { _id, deviceId } = jwt_payload;
            const user = await User.findOne({ _id: _id }).lean()
            user ? done(null, user) : done(null, false)
        } catch (error) {
            console.log("passport ", error)
        }

    }));
}

export default p

