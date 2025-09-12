const passport_jwt = require('passport-jwt');
import jwt from 'jsonwebtoken';


const generateToken = (payload, privateKey) => {
    console.log ("play ", payload)
    const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '20s' });
    const refreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
    return { accessToken, refreshToken };
}

const verifyToken = (token, publicKey) => {
    return new Promise((resovle, reject) => {
        jwt.verify(token, publicKey, (err, decoded) => {
            if (err) {
                reject(err)
            }
            else {
                resovle(decoded)
            }
        })
    })

}

export {
    generateToken,
    verifyToken
}
