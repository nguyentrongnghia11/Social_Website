const passport = require('passport'); // Passport chính
const OAuth2Strategy = require('passport-oauth2'); // Strategy OAuth2
const session = require('express-session');
import { RedisStore } from 'connect-redis'
 import store from '../config/connectRedis'
const { request } = require('express');
const user = require('../modules/user');
import jwt from 'jsonwebtoken';
const axios = require('axios');
import _User from '../modules/user'
require('dotenv').config();



const config = (app) => {

    const redisStore = new RedisStore({
        client: store,
        prefix: "myapp:"
    })

    app.use(session({
        store: redisStore,
        secret: 'trongnghia',
        resave: false,
        saveUninitialized: false, 
        cookie: { secure: false }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        console.log('save redis success');
        return done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        console.log('data in session passport', user)
        return done(null, user);
    });


    // dùng oauth2.0 để lấy profile tiện hơn không cần fetch 

    passport.use(new OAuth2Strategy({
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://accounts.google.com/o/oauth2/token',
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/v1/auth/google/callback",
        scope: ['openid', 'profile', 'email']
    },
        async function (accessToken, refreshToken, params, profile, cb) {

            console.log('day la profile', profile)

            const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            if (!res) {
                return cb(null, false);
            }

            else {
                let user = await _User.findOne({ type: 'google', email: res.data.email });

                if (user) {
                    return cb(null, user);
                }

                let u = new _User({
                    type: 'google',
                    email: res.data.email,
                    name: res.data.name,
                    imgUrl: res.data.picture
                });
                await u.save();
                return cb(null, u);
            }

        }));
}

module.exports = config;