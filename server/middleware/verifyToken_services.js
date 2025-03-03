var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
const User = require('../modules/user')
const jwt = require('jsonwebtoken');
const _token = require('../modules/token');


const authenticateMiddleware = (req, res, next) => {
    console.log('co ')
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.log('co chay vao day khong err')
            return res.status(401).json({ message: err.message });
        }
        else if (!user) {
            console.log('co chay vao day khong')
            return res.status(401).json({ message: 'Unauthorized', });
        }
        req.user = user;
        next();
    })(req, res, next);

}

const getPublicKey = (email) => {
    return new Promise((resolve, reject) => {
        _token.findOne({ email: email }).then((data) => {
            if (data) {
                resolve(data.publicKey);
            } else {
                reject('Không tìm thấy publicKey');
            }
        })
    })
};

const p = (app) => {
    app.use(passport.initialize());
    var opts = {}
    var cookieExtractor = function (req, res) {
        var token = null;
        if (req && req.cookies) {
            console.log('req:', req.cookies['accessToken']);
            token = req.cookies['accessToken'];
        }


        return token;
    };
    opts.jwtFromRequest = cookieExtractor;
    opts.secretOrKeyProvider = async (req, token, done) => {
        console.log('cos chay vao day khong')
        try {
            const { payload: { _doc: { email } } } = jwt.decode(token, { complete: true });
            if (!email) {
                done('Token không hợp lệ', null);
            }

            const publicKey = await getPublicKey(email);
            console.log('publicKey:', publicKey);
            //return publicKey;
            done(null, publicKey);
        } catch (error) {
            console.error('Lỗi khi lấy secret key:', error.message);
            done(error, null);
        }
    };

    passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {

        const { _doc: { _id } } = jwt_payload;
        console.log('jwt_payload:', _id);
        const user = await User.findOne({ _id: _id })

        if (user) {
            return done(null, user);
        }
        return done(null, false);


    }));
}

module.exports = { p, authenticateMiddleware };