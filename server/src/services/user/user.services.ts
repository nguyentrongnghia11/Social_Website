const bcrypt = require('bcrypt');
import _User, { IUser } from '../../models/user';
import _otp from '../../models/otp';
import _Token from '../../models/token';
import _Post from '../../models/post';
import _Group from '../../models/group';
import { Types } from 'mongoose';
import { generateOtpcode } from '../../utils/generateOtpcode';
import { generateToken, verifyToken } from '../../utils/handleToken';
import { buildJwtPayload } from '../../utils/buildJwtPayload';
import { handleNotification } from '../notification/handleNotification.services';
import { generateKeyPair } from '../../utils/generatePairKey';
import { saveUserCache } from '../auth/authSession.services';
import { mailProducer } from '../queue/otpProducer.services';
import { ErrorApi } from '../../middleware/error';
import redisClient from '../../databases/connectRedis';
import { admin } from '../../databases/connectFirebase';
import _Comment from '../../models/comment';

export class UserService {
    async signupWithLocal(email: string) {
        const u = await _User.findOne({ email: email, type: 'local' });
        console.log ("check u", u);
        if (u) {
            throw new ErrorApi(409, 'Account already exists');
        }

        const otpCode = await generateOtpcode();
        await mailProducer(otpCode, email);

        return { success: true };
    }

    async verifyAccountLocal(
        otpCode: string,
        email: string,
        username: string,
        password: string,
        role: string,
        deviceId: string
    ) {
        const acc = await _User.findOne({ email: email, type : 'local' });
        console.log ("check acc", acc);
        if (acc) {
            throw new ErrorApi(409, 'User exists');
        }

        const Otparr = await _otp.find({ email: email });
        if (Otparr.length === 0) {
            throw new ErrorApi(404, 'OTP not found');
        }

        const lastOtp = Otparr[Otparr.length - 1];

        if (lastOtp.otp !== parseInt(otpCode)) {
            throw new ErrorApi(409, 'OTP not match');
        }

        const user = await _User.create({
            name: username,
            password: (await bcrypt.hash(password, 10)).toString(),
            email: email,
            imgUrl: '',
            type: 'local',
            role: role,
        });

        const payload = await buildJwtPayload(user, deviceId);
        const { privateKey, publicKey } = generateKeyPair();
        const { accessToken, refreshToken } = generateToken(payload, privateKey);

        const token = await _Token.create({
            email: email,
            refreshToken: refreshToken,
            publicKey: publicKey,
            device: deviceId
        });

        if (!token) {
            throw new ErrorApi(404, 'Create account failed');
        }

        return { user, accessToken, refreshToken };
    }

    async signin(email: string, password: string, deviceId: string, ip?: string, userAgent?: string) {
        const u = await _User.findOne({ email, type: 'local' })
            .select('email password status name role type')
            .lean();

        if (!u) {
            throw new ErrorApi(404, 'User not found');
        }
        const [rs, groups] = await Promise.all([
            bcrypt.compare(password, u.password),
            _Group.find({ members: u._id }).select('_id').lean()
        ]);

        if (!rs) {
            throw new ErrorApi(401, 'Login fail');
        }
        const user = {
            _id: u._id,
            name: u.name,
            type: u.type,
            role: u.role,
            email: u.email,
            deviceId: deviceId,
            groups: groups,
            status: u.status
        };

        console.log('🔐 Signin: Generating tokens for:', { userId: u._id, email: u.email, deviceId });

        const { privateKey, publicKey } = generateKeyPair();
        const { accessToken, refreshToken } = generateToken(user, privateKey);

        // Update token (critical - must wait)
        const token = await _Token.findOneAndUpdate(
            { email, device: deviceId },
            { refreshToken, publicKey, device: deviceId },
            { new: true, upsert: true, lean: true }
        );

        _User.findByIdAndUpdate(
            u._id,
            {
                $push: {
                    loginHistory: {
                        $each: [{
                            action: 'login',
                            ip: ip || 'unknown',
                            userAgent: userAgent,
                            timestamp: new Date()
                        }],
                        $slice: -50
                    }
                },
                $set: { lastLoginAt: new Date() }
            },
            { lean: true }
        ).catch(err => console.error('Login history update error:', err));

        if (!token) {
            throw new ErrorApi(403, 'Login failed - Forbidden');
        }

        // Cache user data (non-blocking)
        saveUserCache(user, publicKey).catch(err => 
            console.error('Cache save error:', err)
        );

        return { user, accessToken, refreshToken };
    }

    async signInWithGoogle(googleUser: IUser, deviceId: string) {
        const groups = await _Group.find({ members: googleUser._id })
            .select('_id')
            .lean();
            
            const user = {
            _id: googleUser._id,
            name: googleUser.name,
            type: googleUser.type,
            role: googleUser.role,
            email: googleUser.email,
            deviceId: deviceId,
            groups: groups,
            status: googleUser.status
        };

        console.log('🔐 Google Signin: Generating tokens for:', { userId: googleUser._id, email: googleUser.email, deviceId });

        const { privateKey, publicKey } = generateKeyPair();
        const { accessToken, refreshToken } = generateToken(user, privateKey);

        const token = await _Token.findOneAndUpdate(
            { email: googleUser.email, device: deviceId },
            { refreshToken, publicKey, device: deviceId },
            { new: true, upsert: true, lean: true }
        );

        // Update login history
        _User.findByIdAndUpdate(
            googleUser._id,
            {
                $push: {
                    loginHistory: {
                        $each: [{
                            action: 'login_google',
                            ip: 'google_oauth',
                            userAgent: 'google',
                            timestamp: new Date()
                        }],
                        $slice: -50
                    }
                },
                $set: { lastLoginAt: new Date() }
            },
            { lean: true }
        ).catch(err => console.error('Login history update error:', err));

        if (!token) {
            throw new ErrorApi(403, 'Login failed - Forbidden');
        }

        // Cache user data
        saveUserCache(user, publicKey).catch(err => 
            console.error('Cache save error:', err)
        );

        return { user, accessToken, refreshToken };
    }

    async refreshToken(refreshTokenOld: string, deviceId: string) {
        // Step 1: Find the OLD token document by refreshToken + device (most specific query)
        const tokenOld = await _Token.findOne({ refreshToken: refreshTokenOld, device: deviceId })
            .sort({ createdAt: -1 })
            .lean();

        if (!tokenOld?.publicKey) {
            console.error('❌ RefreshToken failed: Token document not found for device:', deviceId);
            throw new ErrorApi(400, 'Public token not found');
        }

        console.log('🔍 Found old token for email:', tokenOld.email, 'device:', deviceId);

        // Step 2: Verify the old refresh token
        const payLoad = await verifyToken(refreshTokenOld, tokenOld.publicKey);
        
        if (!payLoad) {
            console.error('❌ RefreshToken failed: Invalid token signature');
            throw new ErrorApi(401, 'Invalid refresh token');
        }

        // Step 3: CRITICAL - Verify that payload email matches token document email
        if (payLoad.email !== tokenOld.email) {
            console.error('🚨 SECURITY ALERT: Token email mismatch!', {
                payloadEmail: payLoad.email,
                tokenDocEmail: tokenOld.email,
                deviceId
            });
            throw new ErrorApi(403, 'Token validation failed - email mismatch');
        }

        console.log('✅ Token verified for user:', payLoad.email);

        // Step 4: Find the user
        const u = await _User.findOne({ email: tokenOld.email, type: 'local' }).lean();
        
        if (!u) {
            console.error('❌ RefreshToken failed: User not found for email:', tokenOld.email);
            throw new ErrorApi(500, "Not found user");
        }

        // Step 5: Build new JWT payload and generate new tokens
        const user = await buildJwtPayload(u, deviceId);
        const { privateKey, publicKey } = generateKeyPair();
        const { accessToken, refreshToken } = generateToken(user, privateKey);
        
        console.log('🔄 Updating token for email:', tokenOld.email, 'device:', deviceId);

        // Step 6: Update the SAME token document (use _id or unique email+device)
        const token = await _Token.findOneAndUpdate(
            { email: tokenOld.email, device: deviceId }, // Use tokenOld.email (verified), not payLoad.email
            { refreshToken, publicKey },
            { new: true }
        ).lean();

        if (!token) {
            console.error('❌ RefreshToken failed: Failed to update token document');
            throw new ErrorApi(400, "Refresh token failed");
        }

        console.log('✅ Token refreshed successfully for:', tokenOld.email);

        await saveUserCache(user, publicKey);

        return { accessToken, refreshToken, payload: user };
    }

    async getRoleUser(name: string, limit: number = 10) {
        const user = await _User.find(
            { name: { $regex: `^${name}`, $options: "i" } }
        )
            .select('name email imgUrl')
            .limit(limit)
            .lean();

        return user;
    }

    async getUser(limit: number = 5, id?: string) {
        const data = id
            ? await _User.aggregate([
                { $match: { _id: new Types.ObjectId(id as string) } },
                {
                    $lookup: {
                        from: 'posts',
                        localField: '_id',
                        foreignField: 'artistId',
                        as: 'posts',
                        pipeline: [
                            { $project: { react: 1 } }
                        ]
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
                    $project: {
                        name: 1,
                        email: 1,
                        imgUrl: 1,
                        postCount: 1,
                        totalLike: 1
                    }
                }
            ])
            : await _User.find()
                .select('name email imgUrl')
                .limit(Number(limit))
                .lean();

        return data;
    }

    async changePassword(
        email: string,
        oldPassword: string,
        newPassword: string,
        confirmPassword: string,
        deviceId: string
    ) {
        const user = await _User.findOne({ email: email });

        if (!user) {
            throw new ErrorApi(403, 'User not found');
        }

        const isPassword = await bcrypt.compare(oldPassword, user.password);

        if (!isPassword) {
            throw new ErrorApi(403, 'Password is incorrect');
        }

        const newUpdate = await user.updateOne({ password: newPassword }, { new: true });

        if (!newUpdate) {
            throw new ErrorApi(403, 'Update password failed');
        }

        const { password: pass, ...payload } = newUpdate.toObject();
        const { privateKey, publicKey } = generateKeyPair();
        const { accessToken, refreshToken } = generateToken(payload, privateKey);

        const token = await _Token.create({
            email: email,
            refreshToken: refreshToken,
            publicKey: publicKey,
            deviceId: deviceId
        });

        if (!token) {
            throw new ErrorApi(403, 'Create token failed');
        }

        await redisClient.set(`TOKEN-AVAILABLE:${newUpdate._id}`, Math.floor(Date.now() / 1000));

        return { accessToken, refreshToken };
    }

    async logout(email: string, deviceId: string) {
        console.log("logout service", email, deviceId);
        const keyLogout = `TOKEN-AVAILABLE-${email}-${deviceId}`;
        const timeLogout = Math.floor(Date.now() / 1000);

        await redisClient.set(keyLogout, timeLogout);

        const isDelete = await _Token.deleteMany({ email: email, deviceId: deviceId });
        
        if (!isDelete) {
            throw new ErrorApi(403, 'Logout failed');
        }

        await redisClient.DEL(`USER-PUBLICKEY-${email}-${deviceId}`);

        return { success: true };
    }

    async logoutAllDevice(email: string, deviceId: string) {
        const keyLogout = `TOKEN-AVAILABLE-${email}-${deviceId}`;
        const timeLogout = Math.floor(Date.now() / 1000);

        await redisClient.set(keyLogout, timeLogout);

        const isDelete = await _Token.deleteMany({ email: email, deviceId: deviceId });
        
        if (!isDelete) {
            throw new ErrorApi(403, 'Logout failed');
        }

        await redisClient.DEL(`USER-PUBLICKEY-${email}*`);

        return { success: true };
    }

    async regisGroup(token: string, topic: string) {
        const response = await Promise.all([
            admin.messaging().subscribeToTopic(token, `all`),
            admin.messaging().subscribeToTopic(token, topic)
        ]);

        if (!response) {
            throw new ErrorApi(500, 'Subscribe to topic failed');
        }

        return { success: true };
    }

    async updateTokenDevice(userId: string, tokenFcm: string) {
        const isUpdateFcm = await _User.findByIdAndUpdate(
            userId,
            { $addToSet: { tokenFcms: tokenFcm } },
            { new: true }
        ).lean();

        if (!isUpdateFcm) {
            throw new ErrorApi(500, 'Update token failed');
        }

        return { success: true };
    }
    async getUserDetailById(userId: string) {
        const user = await _User.findById(userId)
            .select('_id name email status imgUrl avt_url role createdAt lastLoginAt')
            .lean();

        if (!user) {
            throw new ErrorApi(404, 'User not found');
        }

        // Get user's own posts
        const userPosts = await _Post.aggregate([
            { $match: { artistId: new Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'artistId',
                    foreignField: '_id',
                    as: 'artist'
                }
            },
            { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    react: 1,
                    createdAt: 1,
                    name: '$artist.name',
                    imgUrl: '$artist.imgUrl',
                    avt_url: '$artist.avt_url',
                    commentCount: { $size: '$comments' },
                    reactCount: { $size: '$react' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 50 }
        ]);

        // Get posts that user has liked
        const likedPosts = await _Post.find({ react: new Types.ObjectId(userId) })
            .select('_id title content artistId createdAt react')
            .populate('artistId', 'name imgUrl avt_url')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Get posts that user has commented on
        const commentedPostIds = await _Comment.find({ userId: new Types.ObjectId(userId) })
            .distinct('postId');

        const commentedPosts = await _Post.find({ _id: { $in: commentedPostIds } })
            .select('_id title content artistId createdAt react')
            .populate('artistId', 'name imgUrl avt_url')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return {
            user,
            userPosts,
            likedPosts: likedPosts.map(post => ({
                ...post,
                reactCount: post.react?.length || 0
            })),
            commentedPosts: commentedPosts.map(post => ({
                ...post,
                reactCount: post.react?.length || 0
            }))
        };
    }

    async followUser(userId: string, targetUserId: string) {
        if (userId === targetUserId) {
            throw new ErrorApi(400, 'Cannot follow yourself');
        }

        const [user, targetUser] = await Promise.all([
            _User.findById(userId),
            _User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            throw new ErrorApi(404, 'User not found');
        }

        const targetObjectId = new Types.ObjectId(targetUserId);
        const userObjectId = new Types.ObjectId(userId);

        // Check if already following
        if (user.following?.includes(targetObjectId)) {
            throw new ErrorApi(409, 'Already following this user');
        }

        // Add to following list of current user
        await _User.findByIdAndUpdate(
            userId,
            { $addToSet: { following: targetObjectId } },
            { new: true }
        );

        // Add to followers list of target user
        await _User.findByIdAndUpdate(
            targetUserId,
            { $addToSet: { followers: userObjectId } },
            { new: true }
        );

        // Send notification to target user
        await handleNotification({
            message: `${user.name} đã bắt đầu theo dõi bạn`,
            title: 'Người theo dõi mới',
            receiver: targetObjectId,
            sender: userObjectId,
            type: 'follow',
            read: false,
            link: `/profile/${userId}`
        } as any);

        return { 
            success: true,
            following: true,
            message: `You are now following ${targetUser.name}`
        };
    }

    async unfollowUser(userId: string, targetUserId: string) {
        if (userId === targetUserId) {
            throw new ErrorApi(400, 'Cannot unfollow yourself');
        }

        const [user, targetUser] = await Promise.all([
            _User.findById(userId),
            _User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            throw new ErrorApi(404, 'User not found');
        }

        const targetObjectId = new Types.ObjectId(targetUserId);
        const userObjectId = new Types.ObjectId(userId);

        // Check if not following
        if (!user.following?.includes(targetObjectId)) {
            throw new ErrorApi(409, 'Not following this user');
        }

        // Remove from following list of current user
        await _User.findByIdAndUpdate(
            userId,
            { $pull: { following: targetObjectId } },
            { new: true }
        );

        // Remove from followers list of target user
        await _User.findByIdAndUpdate(
            targetUserId,
            { $pull: { followers: userObjectId } },
            { new: true }
        );

        return { 
            success: true,
            following: false,
            message: `You unfollowed ${targetUser.name}`
        };
    }

    async getFollowers(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const user = await _User.findById(userId)
            .populate({
                path: 'followers',
                select: 'name email imgUrl avt_url status',
                options: {
                    skip,
                    limit
                }
            });

        if (!user) {
            throw new ErrorApi(404, 'User not found');
        }

        const totalFollowers = user.followers?.length || 0;

        return {
            followers: user.followers,
            total: totalFollowers,
            page,
            totalPages: Math.ceil(totalFollowers / limit)
        };
    }

    async getFollowing(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const user = await _User.findById(userId)
            .populate({
                path: 'following',
                select: 'name email imgUrl avt_url status',
                options: {
                    skip,
                    limit
                }
            });

        if (!user) {
            throw new ErrorApi(404, 'User not found');
        }

        const totalFollowing = user.following?.length || 0;

        return {
            following: user.following,
            total: totalFollowing,
            page,
            totalPages: Math.ceil(totalFollowing / limit)
        };
    }

    async checkFollowStatus(userId: string, targetUserId: string) {
        const user = await _User.findById(userId).select('following');

        if (!user) {
            throw new ErrorApi(404, 'User not found');
        }

        const isFollowing = user.following?.some(
            (id: Types.ObjectId) => id.toString() === targetUserId
        ) || false;

        return { isFollowing };
    }
}

export default new UserService();
