import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import store from '../../databases/connectRedis';
import { Express, Request } from 'express';
import _User, { IUser } from '../../models/user';
import axios from 'axios';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

interface GoogleUserInfo {
    email: string;
    name: string;
    picture: string;
}

const config = (app: Express): void => {
    const redisStore = new RedisStore({
        client: store,
        prefix: "myapp:"
    });

    app.use(session({
        store: redisStore,
        secret: process.env.SESSION_SECRET || 'trongnghia',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user: any, done) => {
        console.log('save redis success');
        return done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
        console.log('data in session passport', user);
        return done(null, user);
    });

    // OAuth2.0 strategy
    passport.use(new OAuth2Strategy({
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://accounts.google.com/o/oauth2/token',
        clientID: process.env.CLIENT_ID || '',
        clientSecret: process.env.CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/v1/auth/google/callback",
        scope: ['openid', 'profile', 'email']
    },
        async (accessToken: string, refreshToken: string, params: any, profile: any, cb: any) => {
            try {
                console.log('OAuth2 callback - Access token:', accessToken);

                const res = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                if (!res.data) {
                    return cb(null, false);
                }

                const { email, name, picture } = res.data;

                let user = await _User.findOne({ type: 'google', email });

                if (user) {
                    return cb(null, user);
                }

                const newUser = await _User.create({
                    type: 'google',
                    email,
                    name,
                    imgUrl: picture,
                    role: 'user',
                    status: 'active'
                });

                return cb(null, newUser);
            } catch (error) {
                console.error('OAuth2 error:', error);
                return cb(error, false);
            }
        }
    ));
};

export default config;
