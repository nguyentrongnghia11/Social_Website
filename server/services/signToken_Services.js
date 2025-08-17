const passport_jwt = require('passport-jwt');
import jwt from 'jsonwebtoken';


const generateToken = (payload, privateKey, publicKey) => {
    const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '2h' });
    const refreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
    return { accessToken, refreshToken };
}

const verifyToken = (token, publicKey) => {
    jwt.verify(token, publicKey, (err, decoded) => {
        decoded ? decoded : null
    })
}

export {
    generateToken,
    verifyToken
}
