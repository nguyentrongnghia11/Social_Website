import { NextFunction, Request, Response } from 'express'
const bcrypt = require('bcrypt');
import _User, { IUser } from '../models/user';
import sendOtp from '../services/sendOtp.services'
import _otp from '../models/otp';
import crypto from 'crypto'
import redisClient from '../databases/connectRedis';
import _Token from '../models/token';
import { generateToken } from '../services/signToken_Services'
import _Post from '../models/post'
import { Types } from 'mongoose';
import { verifyToken } from '../services/signToken_Services';
import { generateKey, getPublicKey } from '../services/handleKey.services';
import { admin } from '../databases/connectFirebase';
import _Notification from '../models/notification';
import _Group from '../models/group';
import { buildJwtPayload } from '../utils/buildJwtPayload';
import message from '../models/message';
import { generatePairKey } from '../utils/generatePairKey';
import { saveUserCache } from '../services/auth/authSession.services';
import { setCookie } from '../utils/setCookie';





interface Role {
    role: string
}


class UserController {

    // async signinWithGoogle(req: Request, res : Response, next: NextFunction) {

    //     passport.authenticate('oauth2', { scope: ['profile', 'email'] })(req: Request, res : Response, next: NextFunction);



    // }


    async signupWithLocal(req: Request, res: Response, next: NextFunction) {

        const { email, password, name } = req.body;
        const u = await _User.findOne({ email: email });

        console.log('signup ', u)

        if (u) {
            return res.status(409).json({
                message: 'Account already exists'
            });
        }

        const send = await sendOtp(email);

        send.status === 400 ? res.status(400).json({
            message: 'Send otp failed'
        }) : res.json({
            status: 200,
            message: 'Send otp success',
            otp: send.otp
        })

    }
    async verifyAccountLocal(req: Request, res: Response, next: NextFunction) {
        const { otpCode, email, username, password, role } = req.body;


        const acc = await _User.findOne({ email: email });

        if (acc) {
            return res.status(400).json({
                message: 'Account already exists'
            })
        }


        const Otparr = await _otp.find({ email: email });
        // check ngay day

        if (Otparr.length === 0) {
            return res.status(204).json({
                message: 'Otp not found',
                status: 204
            })
        }
        const lastOtp = Otparr[Otparr.length - 1];


        if (lastOtp.otp != otpCode) {
            return res.status(400).json({
                message: 'Otp not match'
            })
        }

        const u = new _User({
            name: username,
            password: (await bcrypt.hash(password, 10)).toString(),
            email: email,
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

        let newUser = await u.save()

        const { password: pass, ...payload } = newUser.toObject() // lay het tru password

        if (newUser) {
            const { accessToken, refreshToken } = generateToken(payload, privateKey);
            const t = new _Token({
                email: email,
                refreshToken: refreshToken,
                publicKey: publicKey
            })

            await t.save().then((token: unknown) => {

                res.cookie('accessToken', accessToken, { httpOnly: true });
                res.cookie('refreshToken', refreshToken, { httpOnly: true });
                return res.status(200).json({
                    message: 'Create account success',
                    result: payload
                })
            }).catch((err: any) => {

                return res.status(400).json({
                    message: 'Create account failed'
                });
            });
        }
    }

    async signin(req: Request, res: Response, next: NextFunction) {
        const { account, password } = req.body;
        const deviceId: string | undefined | string[] = req.headers["x-device-id"]

        if (!account || !password || !deviceId) {
            return res.status(400).json({
                message: 'Missing data'
            })
        }

        const u = await _User.findOne({ email: account, type: 'local' }).lean();

        if (!u) {
            return res.status(401).json({
                message: 'Login fail'
            })
        }
        const rs = await bcrypt.compare(password, u.password)

        if (!rs) {
            return res.status(401).json({
                message: 'Login fail',
                login: false
            })
        }

        else {
            try {
                const user = await buildJwtPayload(u, deviceId)

                console.log(typeof (user))

                const { privateKey, publicKey } = generatePairKey();
                const { accessToken, refreshToken } = generateToken(user, privateKey)


                const token = await _Token.findOneAndUpdate(
                    { email: account, device: deviceId },
                    { refreshToken, publicKey, deviceId },
                    { new: true, upsert: true }
                ).lean()

                if (!token) {
                    return res.status(403).json({
                        message: 'Login failed - Forbiden'
                    });
                }
                saveUserCache(user, publicKey)
                setCookie(res, accessToken, refreshToken)

                return res.status(200).json({
                    message: "login success",
                    result: user,
                    refreshToken: refreshToken
                })
            } catch (error) {
                console.log("Loi o login ", error)
            }
        }
    }


    async home(req: Request, res: Response, next: NextFunction) {


        return res.status(200).json({
            message: 'Welcome to the home page',
            result: req.user
        });
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        const deviceId: string | undefined | string[] = req.headers["x-device-id"]
        const refreshTokenOld = req.cookies.refreshToken;


        console.log(deviceId, refreshTokenOld)
        if (!refreshTokenOld || !deviceId) {
            return res.status(400).json({
                message: 'Refresh token not found'
            });
        }

        const tokenOld = await _Token.findOne({ refreshToken: refreshTokenOld, device: deviceId }).sort({ createdAt: -1 }).lean()

        console.log("Token ", tokenOld?.publicKey)
        const payLoad = await verifyToken(refreshTokenOld, tokenOld?.publicKey)



        if (payLoad) {
            const { privateKey, publicKey } = generatePairKey()

            const u = await _User.findOne({ email: payLoad.email, type: 'local' }).lean();
            if (!u) {
                return res.status(500).json({
                    message: "Not found user"
                })
            }

            const user = await buildJwtPayload(u, deviceId)
            const { accessToken, refreshToken } = generateToken(user, privateKey)
            const token = await _Token.findOneAndUpdate(
                { email: payLoad.email, device: deviceId },
                { refreshToken, publicKey, deviceId },
                { new: true, upsert: true }
            ).lean()

            if (!token) {
                return res.status(400).json({
                    message: "Refresh token failed"
                })
            }

            saveUserCache(user, publicKey)
            setCookie(res, accessToken, refreshToken)
            return res.status(200).json({
                message: 'Refresh token generated successfully',
                result: payLoad
            })
        }


    }

    async getRoleUser(req: Request, res: Response, next: NextFunction) {
        const name = req.query.name

        console.log("day la name ", name)
        const user = await _User.find({ name: { $regex: `^${name}`, $options: "i" } }).lean()
        return res.status(200).json({
            message: "search user success",
            result: user
        })
    }


    async getUser(req: Request, res: Response, next: NextFunction) {

        const { limit = 5, id } = req.query;
        const data = id
            ? await _User.aggregate([
                {
                    $lookup: {
                        from: 'posts',              // tên collection post
                        localField: '_id',          // _User._id
                        foreignField: 'artistId',   // _Post.artistId
                        as: 'posts'                 // kết quả sẽ gộp vào field này
                    }
                },
                {
                    $addFields: {
                        postCount: { $size: '$posts' },
                        totalLike: {
                            $sum: {
                                $map: {
                                    input: '$posts',
                                    as: 'post',
                                    in: { $size: { $ifNull: ['$$post.react', []] } }
                                }
                            }
                        }
                    }
                },
                {
                    $match: { _id: new Types.ObjectId(id as string) }
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        postCount: 1,
                        totalLike: 1
                    }
                }
            ])
            : await _User.find().limit(Number(limit));

        res.status(200).json({
            message: 'Get user success',
            result: data,
        });
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        const { email, oldPassword, newPassword, confirmPassword } = req.body;
        const deviceId = req.headers['x-device-id']
        const user = await _User.findOne({ email: email })


        if (!user) {
            return res.status(403).json({
                message: 'User not found',
            })
        }

        const isPassword = await bcrypt.compare(oldPassword, user.password)

        if (!isPassword) {
            return res.status(403).json({
                message: 'Password is incorrect',
            })
        }

        const newUpdate = await user.updateOne({ password: newPassword }, { new: true })



        if (!newUpdate) {
            return res.status(403).json({
                message: 'Update password failed',
            })
        }


        const { password: pass, ...payload } = newUpdate.toObject()

        const { privateKey, publicKey } = generateKey();

        const { accessToken, refreshToken } = generateToken(payload, privateKey);
        const token = await _Token.create({
            email: email,
            refreshToken: refreshToken,
            publicKey: publicKey,
            deviceId: deviceId
        })


        if (!token) {
            return res.status(403).json({
                message: 'Create token failed',
            })
        }

        res.cookie('accessToken', accessToken, { httpOnly: true });
        res.cookie('refreshToken', refreshToken, { httpOnly: true });

        // revoke token 

        redisClient.set(`TOKEN-AVAILABLE:${newUpdate._id}`, Math.floor(Date.now() / 1000))

        return res.status(200).json({
            message: 'Change password success',
        })
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        // revoke all token on currently device

        const deviceId = req.headers['x-device-id']
        const user = req.user as IUser
        const keyLogout = `TOKEN-AVAILABLE-${user.email}-${deviceId}`
        const timeLogout = Math.floor(Date.now() / 1000)

        await redisClient.set(keyLogout, timeLogout)


        const isDelete = await _Token.deleteMany({ email: user.email, deviceId: deviceId })
        if (!isDelete) {
            return res.status(403).json({
                message: 'Logout failed'
            })
        }

        await redisClient.DEL(`USER-PUBLICKEY-${user.email}-${deviceId}`)

        // await sendEventDevice("Tài khoản của đang được đăng nhập ở 1 thiêt bị khác", user.tokenFcms)

        return res.status(200).json({
            message: 'Logout success'
        })

    }



    async logoutAllDevice(req: Request, res: Response, next: NextFunction) {
        // revoke all token on currently device

        const deviceId = req.headers['x-device-id']
        const user = req.user as IUser


        const keyLogout = `TOKEN-AVAILABLE-${user.email}-${deviceId}`
        const timeLogout = Math.floor(Date.now() / 1000)

        await redisClient.set(keyLogout, timeLogout)


        const isDelete = await _Token.deleteMany({ email: user.email, deviceId: deviceId })
        if (!isDelete) {
            return res.status(403).json({
                message: 'Logout failed'
            })
        }

        await redisClient.DEL(`USER-PUBLICKEY-${user.email}*`)

        return res.status(200).json({
            message: 'Logout success'
        })

    }


    async regisGroup(req: Request, res: Response, next: NextFunction) {

        const { token, topic } = req.body;
        const response = Promise.all([
            await admin.messaging().subscribeToTopic(token, `all`),
            await admin.messaging().subscribeToTopic(token, topic)
        ])

        if (!response) {
            return res.status(500).json({
                message: 'Subscribe to topic failed'

            })
        }
        return res.status(200).json({
            message: 'Subscribe to topic success'
        })
    }

    async updateTokenDevice(req: Request, res: Response, next: NextFunction) {

        const { _id } = req.user as IUser
        const { tokenFcm } = req.body
        const user = await _User.findById(_id);
        if (!user) {
            return res.status(404).json({
                message: "Not found user"
            })
        }

        const isUpdateFcm = await _User.updateOne({ _id: _id }, { $addToSet: { tokenFcms: tokenFcm } })

        if (!isUpdateFcm) {
            return res.status(500).json({
                message: 'Update token failed'
            })
        }
        return res.status(200).json({
            message: 'Update token success'
        })
    }

}

export default new UserController();