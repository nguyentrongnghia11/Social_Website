import jwt, { Secret } from 'jsonwebtoken';
import _Token from '../../models/token';
import redisClient from '../../databases/connectRedis';

const REDIS_KEY_PREFIX = 'USER-PUBLICKEY-';
const CACHE_TTL = 3600;

const getPublicKey = async (email: string, deviceId: string): Promise<string> => {
    const redisKey = `${REDIS_KEY_PREFIX}${email}-${deviceId}`;
    let publicKey = await redisClient.get(redisKey);
    
    if (publicKey) {
        return publicKey;
    }
    
    const tokenDoc = await _Token.findOne({ email, device: deviceId }).select('publicKey').lean();
    
    if (!tokenDoc?.publicKey) {
        throw new Error('Không tìm thấy publicKey');
    }
    
    await redisClient.setEx(redisKey, CACHE_TTL, tokenDoc.publicKey);
    
    return tokenDoc.publicKey;
};

export { getPublicKey }


