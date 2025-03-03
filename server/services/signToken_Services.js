



const passport = require('passport');
const passport_jwt = require('passport-jwt');
const jwt = require('jsonwebtoken');


const generateToken = (payload, privateKey, publicKey) => {
    const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '2h' });
    const reFreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });


    return { accessToken, reFreshToken };
}



module.exports = {
    generateToken
}
