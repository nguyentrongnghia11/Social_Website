
const express = require('express');
const passport = require('passport');

const router = express.Router();
const controller = require('../controller/userController');
const { authenticateMiddleware } = require('../middleware/verifyToken_services');

console.log('1111')

router.post('/v1/login', controller.signup);
router.post('/v1/refresh', controller.refreshToken);
router.get('/v1/google', passport.authenticate('oauth2', { scope: ['profile', 'email', 'openid'] }));
router.post('/v1/local/verify', controller.verifyAccountLocal);
router.post('/v1/local', controller.signinWithLocal);
router.get('/v1/role', authenticateMiddleware, controller.getRoleUser);
router.get('/callback', passport.authenticate('oauth2', { failureRedirect: '/' }), controller.home);



module.exports = router;