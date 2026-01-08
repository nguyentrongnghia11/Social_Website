import passport from 'passport'

import express from 'express'

import controller from '../controller/userController';
import { authenticateMiddleware } from '../middleware/verifyToken';
import { validateSignin, validateSignup, validateToken, verifyAccountLocal } from '../validations/validation';
import { limiter } from '../middleware/checkRatelimt';

const router = express.Router();

router.post('/v1/login', validateSignin, controller.signin);
router.get('/v1/user/search', limiter ,controller.getRoleUser);
router.post('/notice', controller.regisGroup);
router.get('/v1/user/:id/detail', controller.getUserDetail);
router.get('/v1/user/me', authenticateMiddleware, controller.getCurrentUser);
router.get('/v1/user', controller.getUser);
router.patch('/v1/token', authenticateMiddleware, controller.updateTokenDevice);
router.post('/v1/refresh', controller.refreshToken);
router.get('/v1/google', (req, res, next) => {
    const deviceId = req.query.deviceId || req.cookies.deviceId;
    const authenticator = passport.authenticate('oauth2', {
        scope: ['profile', 'email', 'openid'],
        state: deviceId as string || undefined
    });
    authenticator(req, res, next);
});
router.post('/v1/local/verify', validateSignup, controller.verifyAccountLocal);
router.post('/v1/local', validateSignup, controller.signupWithLocal);
router.delete('/v1/logout', authenticateMiddleware, controller.logout);
router.get('/v1/role', authenticateMiddleware, controller.getRoleUser);
router.get('/v1/auth/google/callback', passport.authenticate('oauth2', { failureRedirect: '/', session: false }), controller.googleCallback);
router.get('/v1/unread-count', authenticateMiddleware, controller.getUnreadCount);

// Follow/Unfollow routes
router.post('/v1/user/:id/follow', authenticateMiddleware, controller.followUser);
router.delete('/v1/user/:id/unfollow', authenticateMiddleware, controller.unfollowUser);
router.get('/v1/user/:id/followers', controller.getFollowers);
router.get('/v1/user/:id/following', controller.getFollowing);
router.get('/v1/user/:id/follow/status', authenticateMiddleware, controller.checkFollowStatus);

export default router;