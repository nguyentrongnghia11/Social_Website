import jwt from 'jsonwebtoken';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

const generateToken = (payload: any, privateKey: string): TokenPair => {
    const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
    return { accessToken, refreshToken };
}

const verifyToken = async (token: string, publicKey: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
}

export {
    generateToken,
    verifyToken
}
