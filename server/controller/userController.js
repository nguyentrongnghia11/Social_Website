
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const _user = require('../modules/user');
const passport = require('passport')
const OAuth2Strategy = require('passport-oauth2');
const _User = require('../modules/user');
const sendOtp = require('../services/sendOtp_Services')
const _otp = require('../modules/otp');
const crypto = require('crypto');
const { type } = require('os');
const { format } = require('path');
const _Token = require('../modules/token');
const { generateToken } = require('../services/signToken_Services');






class UserController {

    // async signinWithGoogle(req, res, next) {

    //     passport.authenticate('oauth2', { scope: ['profile', 'email'] })(req, res, next);



    // }

    async signinWithLocal(req, res, next) {

        const { account, password } = req.body;

        const u = await _User.findOne({ name: account });



        if (u) {
            return res.status(204).json({
                message: 'Account already exists'
            });
        }

        const send = await sendOtp(account);

        sendOtp.status === 400 ? res.status(400).json({
            message: 'Send otp failed'
        }) : res.json({
            status: 200,
            message: 'Send otp success',
            otp: send.otp
        })








    }
    async verifyAccountLocal(req, res, next) {



        const { otp, account, password, role } = req.body;

        console.log(account)

        const acc = await _User.findOne({ name: account });

        if (acc) {
            return res.status(400).json({
                message: 'Account already exists'
            })
        }


        const Otparr = await _otp.find({ email: account });
        console.log(Otparr)
        // check ngay day

        if (Otparr.length === 0) {
            return res.json({
                message: 'Otp not found',
                status: 204
            })
        }
        const lastOtp = Otparr[Otparr.length - 1];
        console.log(lastOtp.otp)
        console.log(otp)

        if (lastOtp.otp != otp) {
            return res.status(400).json({
                message: 'Otp not match'
            })
        }

        const u = new _User({
            name: account,
            password: (await bcrypt.hash(password, 10)).toString(),
            email: account,
            imgUrl: '',
            type: 'local',
            role: role,
        })

        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        })



        console.log(privateKey, '  ', publicKey);






        let newUser = await u.save()



        const { password: pass, ...payload } = newUser // lay het tru password

        if (newUser) {
            const { accessToken, reFreshToken } = generateToken(payload, privateKey, publicKey);

            const t = new _Token({
                email: account,
                refreshToken: reFreshToken,
                publicKey: publicKey
            })

            await t.save().then((token) => {
                console.log(token)
                res.cookie('accessToken', accessToken, { httpOnly: true });
                res.cookie('refreshToken', reFreshToken, { httpOnly: true });
                return res.status(200).json({
                    message: 'Create account success',
                    result: payload
                })
            }).catch((err) => {
                console.log(err)
                return res.status(400).json({
                    message: 'Create account failed'
                });

            });

        }





    }

    async signup(req, res, next) {
        const { account, password } = req.body;

        console.log(account, password)

        const u = await _User.findOne({ email: account, type: 'local' })
        console.log(password, '  dsfds;fjklsdf', u.password)

        if (!u) {
            return res.json({
                status: 204,
                message: 'Account already exists'
            })
        }


        const rs = await bcrypt.compare(password, u.password)
        if (rs === true) {
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            })


            const { password, ...payload } = u


            const { accessToken, reFreshToken } = generateToken(payload, privateKey, publicKey)



            const token = await _Token.findOneAndUpdate({ email: account }, { refreshToken: reFreshToken, publicKey: publicKey }, { new: true, upsert: true })

            if (!token) {
                return res.status(400).json({
                    message: 'Login failed'
                });
            }

            res.cookie('accessToken', accessToken, { httpOnly: true });
            res.cookie('refreshToken', reFreshToken, { httpOnly: true });
            return res.status(200).json({
                message: 'Login success',
                result: u,
                refreshToken: reFreshToken,
                status: 200
            })


        }




    }


    async home(req, res, next) {

        console.log(req.user);

        return res.status(200).json({
            message: 'Welcome to the home page',
            result: req.profile
        });
    }

    async refreshToken(req, res, next) {

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: 'Refresh token not found'
            });
        }

        // const token = await 

    }

    async getRoleUser(req, res, next) {

        console.log(req.user)
        return res.status(200).json({
            message: 'Get role success',
            result: req.user.role   
        })

    }

}

module.exports = new UserController();