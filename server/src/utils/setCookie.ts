import { Response } from 'express'
export const setCookie = (res: Response, accessToken: string, refreshToken: string) => {
    const maxAccessToken: number = 15 * 60 * 1000;
    const maxRefreshToken: number = 24 * 60 * 60 * 1000;

    const isProduction = process.env.NODE_ENV === 'production';
    console.log("production or nottttt: ", isProduction);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: maxAccessToken,
        secure: isProduction,  
        sameSite: isProduction ? 'none' : 'lax'
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: maxRefreshToken,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });
}