
import jwt from 'jsonwebtoken';


const generateToken = (payload: any, privateKey: string) => {
    console.log("play ", payload)
    const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
    return { accessToken, refreshToken };
}

const verifyToken = (token: string, publicKey: string):any => {
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
