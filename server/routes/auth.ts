
import passport from 'passport'

import express from 'express'

const router = express.Router();
import controller from '../controller/userController';
import { authenticateMiddleware } from '../middleware/verifyToken_services';


router.post('/v1/login', controller.signin);
router.get('/v1/user', controller.getRoleUser);
router.post('/notice', controller.regisGroup);
router.get('/v1/user', controller.getUser);
router.patch('/v1/token', authenticateMiddleware, controller.updateTokenDevice);
router.post('/v1/refresh', controller.refreshToken);
router.get('/v1/google', passport.authenticate('oauth2', { scope: ['profile', 'email', 'openid'] }));
router.post('/v1/local/verify', controller.verifyAccountLocal);
router.post('/v1/local', controller.signupWithLocal);
router.delete('/v1/logout', authenticateMiddleware, controller.logout);
router.get('/v1/role', authenticateMiddleware, controller.getRoleUser);
router.get('/callback', passport.authenticate('oauth2', { failureRedirect: '/' }), controller.home);


export default router;