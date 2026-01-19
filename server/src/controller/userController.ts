import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/user';
import userService from '../services/user/user.services';
import { setCookie } from '../utils/setCookie';

import redisClient from '../databases/connectRedis';

class UserController {
    async signupWithLocal(req: Request, res: Response, next: NextFunction) {
        console.log("req.body", req.body);
        try {
            const { email } = req.body;

            console.log("email", email);

            await userService.signupWithLocal(email);

            res.json({
                status: 200,
                message: 'Send otp success'
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyAccountLocal(req: Request, res: Response, next: NextFunction) {
        try {
            const { otpCode, email, username, password, role } = req.body;
            const deviceId: string | undefined | string[] = req.headers["x-device-id"];



            if (!deviceId || Array.isArray(deviceId)) {
                return res.status(400).json({ message: 'Invalid device ID' });
            }

            console.log("otpCode", otpCode);

            const result = await userService.verifyAccountLocal(otpCode, email, username, password, role, deviceId);

            setCookie(res, result.accessToken, result.refreshToken);

            return res.status(201).json({
                message: 'Create account success',
                result: result.user
            });
        } catch (error) {
            next(error);
        }
    }

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const deviceId: string | undefined | string[] = req.headers["x-device-id"];

            if (!email || !password || !deviceId || Array.isArray(deviceId)) {
                return res.status(400).json({
                    message: 'Missing data'
                });
            }
            const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                req.socket.remoteAddress ||
                'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            const result = await userService.signin(email, password, deviceId, ip, userAgent);

            // Lấy unreadCount từ Redis
            const unreadCount = await redisClient.get(`unread-count:${result.user._id}`);

            setCookie(res, result.accessToken, result.refreshToken);
            return res.status(200).json({
                message: "login success",
                result: {
                    user: { ...result.user, unreadCount: parseInt(unreadCount || '0') },
                },
                refreshToken: result.refreshToken
            });
        } catch (error) {
            next(error);
        }
    }

    async home(req: Request, res: Response, next: NextFunction) {
        return res.status(200).json({
            message: 'Welcome to the home page',
            result: req.user
        });
    }

    async googleCallback(req: Request, res: Response, next: NextFunction) {
        try {
            // Lấy device ID từ nhiều nguồn: query param > state > cookie > header
            let deviceId: string | undefined =
                (req.query.deviceId as string) ||
                (req.query.state as string) ||
                req.cookies.deviceId ||
                (Array.isArray(req.headers["x-device-id"]) ? undefined : req.headers["x-device-id"]);

            if (!deviceId) {
                return res.status(400).json({
                    message: 'Invalid device ID',
                    error: 'Device ID is required for authentication. Please include it as query parameter: ?deviceId=xxx'
                });
            }

            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication failed',
                    error: 'No user data received from Google'
                });
            }

            const googleUser = req.user as IUser;

            const result = await userService.signInWithGoogle(googleUser, deviceId);

            setCookie(res, result.accessToken, result.refreshToken);

            // Redirect về frontend với user data
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const userData = {
                _id: result.user._id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                type: result.user.type,
                status: result.user.status,
                deviceId: deviceId
            };

            console.log('📤 Redirecting to frontend with userData:', userData);

            return res.redirect(`${frontendUrl}/auth/callback?success=true&user=${encodeURIComponent(JSON.stringify(userData))}`);
        } catch (error) {
            console.error('Google callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            return res.redirect(`${frontendUrl}/auth/callback?success=false&error=${encodeURIComponent((error as Error).message)}`);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const deviceId: string | undefined | string[] = req.headers["x-device-id"];
            const refreshTokenOld = req.cookies.refreshToken;

            if (!refreshTokenOld || !deviceId || Array.isArray(deviceId)) {
                return res.status(400).json({
                    message: 'Refresh token not found'
                });
            }

            const result = await userService.refreshToken(refreshTokenOld, deviceId);

            setCookie(res, result.accessToken, result.refreshToken);

            return res.status(200).json({
                message: 'Refresh token generated successfully',
                result: result.payload
            });
        } catch (error) {
            next(error);
        }
    }

    async getRoleUser(req: Request, res: Response, next: NextFunction) {
        try {
            const name = req.query.name as string;
            const limit = parseInt(req.query.limit as string) || 10;

            const user = await userService.getRoleUser(name, limit);

            return res.status(200).json({
                message: "search user success",
                result: user
            });
        } catch (error) {
            next(error);
        }
    }

    async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit = 5, id } = req.query;

            const data = await userService.getUser(Number(limit), id as string);

            res.status(200).json({
                message: 'Get user success',
                result: data,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, oldPassword, newPassword, confirmPassword } = req.body;
            const deviceId = req.headers['x-device-id'];

            if (Array.isArray(deviceId) || !deviceId) {
                return res.status(400).json({
                    message: 'Invalid device ID',
                });
            }

            const result = await userService.changePassword(email, oldPassword, newPassword, confirmPassword, deviceId);

            res.cookie('accessToken', result.accessToken, { httpOnly: true });
            res.cookie('refreshToken', result.refreshToken, { httpOnly: true });

            return res.status(200).json({
                message: 'Change password success',
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const deviceId = req.headers['x-device-id'];
            const user = req.user as IUser;

            if (Array.isArray(deviceId) || !deviceId) {
                return res.status(400).json({
                    message: 'Invalid device ID',
                });
            }

            await userService.logout(user.email, deviceId);

            return res.status(200).json({
                message: 'Logout success'
            });
        } catch (error) {
            next(error);
        }
    }

    async logoutAllDevice(req: Request, res: Response, next: NextFunction) {
        try {
            const deviceId = req.headers['x-device-id'];
            const user = req.user as IUser;

            if (Array.isArray(deviceId) || !deviceId) {
                return res.status(400).json({
                    message: 'Invalid device ID',
                });
            }

            await userService.logoutAllDevice(user.email, deviceId);

            return res.status(200).json({
                message: 'Logout success'
            });
        } catch (error) {
            next(error);
        }
    }

    async regisGroup(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, topic } = req.body;

            await userService.regisGroup(token, topic);

            return res.status(200).json({
                message: 'Subscribe to topic success'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTokenDevice(req: Request, res: Response, next: NextFunction) {
        try {
            const { _id } = req.user as IUser;
            const { tokenFcm } = req.body;

            await userService.updateTokenDevice(_id.toString(), tokenFcm);

            return res.status(200).json({
                message: 'Update token success'
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    message: 'User ID is required'
                });
            }

            const result = await userService.getUserDetailById(id);

            return res.status(200).json({
                message: 'Get user detail success',
                result
            });
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;

            if (!user) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }

            const deviceId = Array.isArray(req.headers["x-device-id"])
                ? req.headers["x-device-id"][0]
                : req.headers["x-device-id"];

            return res.status(200).json({
                message: 'Get current user success',
                result: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    type: user.type,
                    status: user.status,
                    imgUrl: user.imgUrl,
                    deviceId: deviceId || undefined
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async followUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;
            const { id: targetUserId } = req.params;

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await userService.followUser(user._id.toString(), targetUserId);

            return res.status(200).json({
                message: result.message,
                result: {
                    following: result.following
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async unfollowUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;
            const { id: targetUserId } = req.params;

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await userService.unfollowUser(user._id.toString(), targetUserId);

            return res.status(200).json({
                message: result.message,
                result: {
                    following: result.following
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getFollowers(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await userService.getFollowers(userId, page, limit);

            return res.status(200).json({
                message: 'Get followers success',
                result
            });
        } catch (error) {
            next(error);
        }
    }

    async getFollowing(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await userService.getFollowing(userId, page, limit);

            return res.status(200).json({
                message: 'Get following success',
                result
            });
        } catch (error) {
            next(error);
        }
    }

    async checkFollowStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;
            const { id: targetUserId } = req.params;

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await userService.checkFollowStatus(user._id.toString(), targetUserId);

            return res.status(200).json({
                message: 'Check follow status success',
                result
            });
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as IUser;
            const redisClient = (await import('../databases/connectRedis')).default;
            const count = await redisClient.get(`unread-count:${user._id}`);
            res.json({ unreadCount: parseInt(count || '0') });
        } catch (error) {
            next(error);
        }
    }

    async validateToken(req: Request, res: Response, next: NextFunction) {
        try {
            // Already validated by middleware
            return res.status(200).json({ valid: true });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user as IUser;
            const { name, biography } = req.body;

            const updatedUser = await userService.updateProfile(userId._id.toString(), { name, biography });

            return res.status(200).json({ success: true, result: updatedUser });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
