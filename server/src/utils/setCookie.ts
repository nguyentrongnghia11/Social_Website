import { Response } from 'express'
export const setCookie = (res: Response, accessToken: string, refreshToken: string) => {
    const maxAccessToken: number = 15 * 60 * 1000; 
    const maxRefreshToken: number = 24 * 60 * 60 * 1000; 
    
    res.cookie('accessToken', accessToken, { 
        httpOnly: true, 
        maxAge: maxAccessToken,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict'
    });
    
    res.cookie('refreshToken', refreshToken, { 
        httpOnly: true, 
        maxAge: maxRefreshToken,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
}