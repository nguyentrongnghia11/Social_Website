const jwt = require('jsonwebtoken');

const { request } = require('http');
const _token = require('../modules/token');

// Middleware xác thực token
const getPublicKeyy = async (token) => {
   

    const result = token.replace(/\s+/g, '');
    const de = jwt.decode(result);
    const { _doc: { email } } = de
    
    const key = await _token.findOne({ email: email });
    return key.publicKey;
};


module.exports = getPublicKeyy