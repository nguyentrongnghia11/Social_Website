import crypto from 'crypto';

import jwt, { Secret } from 'jsonwebtoken';
import _Token, { Token } from '../../models/token';
import redisClient from '../../databases/connectRedis';


const getPublicKey = (email: string, deviceId: string) => {

    // USER-PUBLICKEY-${user.email}-${user.deviceId}`
    return new Promise(async (resolve, reject) => {
        let publicKey: any = await redisClient.get(`USER-PUBLICKEY-${email}-${deviceId}`);

        if (publicKey) {
            resolve(publicKey)
        }
        else {
            publicKey = await _Token.findOne({ email: email, device: deviceId }).select({ publicKey: 1 })
            if (publicKey) {
                resolve(publicKey.publicKey)
            }
            else {
                reject('Không tìm thấy publicKey');
            }
        }
    })
};


export { getPublicKey }


