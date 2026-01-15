import { Request, Response, NextFunction } from 'express'
import { Strategy as JwtStrategy } from 'passport-jwt';
import passport from 'passport';
import User from '../models/user'
import jwt, { JwtPayload } from 'jsonwebtoken';
import _Token from '../models/token';
import redisClient from '../databases/connectRedis';
import { getPublicKey } from '../services/auth/handlePublicKey.services';
import { ErrorApi } from './error';

export const authenticateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return passport.authenticate('jwt', { session: true }, (err: any, user: unknown, info: unknown) => {
        if (err) return next(new ErrorApi(401, err.message))

        else if (!user) return next(new ErrorApi(401, { message: 'Unauthorized', code: 'Token expired' }))

        req.user = user
        next();

    })(req, res, next);
}

const stragyVerifyLocal = () => {
    const opts: any = {}
    const cookieExtractor = function (req: Request, res: Response) {
        return req?.cookies?.['accessToken'] || null;
    };
    
    opts.jwtFromRequest = cookieExtractor;
    
    opts.secretOrKeyProvider = async (req: Request, token: string, done: any) => {
        try {
            const decoded = jwt.decode(token, { json: true }) as JwtPayload | null;
            if (!decoded?.email || !decoded?.deviceId) {
                return done(null, false, { message: 'Invalid token' });
            }
            
            const { email, deviceId, iat: timeCreateToken } = decoded;

            if (timeCreateToken) {
                const [timeLogout, timeLogoutAllDevice] = await Promise.all([
                    redisClient.get(`TOKEN-AVAILABLE-${email}-${deviceId}`),
                    redisClient.get(`TOKEN-AVAILABLE-ALL-${email}`)
                ]);
                
                const logoutTime = timeLogout ? parseInt(timeLogout) : null;
                const logoutAllTime = timeLogoutAllDevice ? parseInt(timeLogoutAllDevice) : null;
                
                if ((logoutTime && timeCreateToken < logoutTime) || 
                    (logoutAllTime && timeCreateToken < logoutAllTime)) {
                    return done(null, false, { message: 'Token đã bị thu hồi' });
                }
            }

            const publicKey = await getPublicKey(email, deviceId);

            console.log ("public key email ", email, " device ", deviceId, ' key ', publicKey.substring(0, 30) + '...'  )

            return done(null, publicKey);
        } catch (error: any) {
            return done(error, null);
        }
    };

    passport.use(new JwtStrategy(opts, async function (jwt_payload: JwtPayload, done: any) {
        try {
            const { _id } = jwt_payload;
            const user = await User.findOne({ _id }).lean();
            return user ? done(null, user) : done(null, false);
        } catch (error) {
            return done(error, null);
        }
    }));
}

export default stragyVerifyLocal

