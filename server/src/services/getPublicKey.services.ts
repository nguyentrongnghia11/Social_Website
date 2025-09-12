import jwt from 'jsonwebtoken';
import { json } from 'stream/consumers';
import _Token, { Token } from '../models/token';
// Middleware xác thực token
const getPublicKeyy = async (token: string) => {

    const result = token.replace(/\s+/g, '');
    const decode = jwt.decode(result, { json: true });
    const { email } = decode as Token

    const key = await _Token.findOne({ email: email }).lean();
    return key ? key.publicKey : null;
};


export default getPublicKeyy