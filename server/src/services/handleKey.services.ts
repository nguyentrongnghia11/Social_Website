import crypto from 'crypto';

import jwt, { Secret } from 'jsonwebtoken';
import _Token, { Token } from '../models/token';
import redisClient from '../databases/connectRedis';


const getPublicKey = (email: string, deviceId: string) => {
    return new Promise(async (resolve, reject) => {
        let publicKey: any = await redisClient.get(`USER-PUBLICKEY-${email}-${deviceId}`);

        if (publicKey) {
            resolve(publicKey)
        }
        else {
            publicKey = await _Token.findOne({ email: email, deviceId: deviceId }).select({ publicKey: 1 })
            if (publicKey) {
                resolve(publicKey)
            }
            else {
                reject('Không tìm thấy publicKey');
            }
        }
    })
};


const generateKey = () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    })

    return { privateKey, publicKey }
}

export { getPublicKey, generateKey }


