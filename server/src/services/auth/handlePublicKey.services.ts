import jwt, { Secret } from 'jsonwebtoken';
import _Token from '../../models/token';
import redisClient from '../../databases/connectRedis';

const REDIS_KEY_PREFIX = 'USER-PUBLICKEY-';
const CACHE_TTL = 3600; // 1 hour

const getPublicKey = async (email: string, deviceId: string): Promise<string> => {
    const redisKey = `${REDIS_KEY_PREFIX}${email}-${deviceId}`;
    
    // Try Redis cache first
    let publicKey = await redisClient.get(redisKey);
    
    if (publicKey) {
        return publicKey;
    }
    
    // Fallback to database
    const tokenDoc = await _Token.findOne({ email, device: deviceId }).select('publicKey').lean();
    
    if (!tokenDoc?.publicKey) {
        throw new Error('Không tìm thấy publicKey');
    }
    
    // Cache the result
    await redisClient.setEx(redisKey, CACHE_TTL, tokenDoc.publicKey);
    
    return tokenDoc.publicKey;
};

export { getPublicKey }


