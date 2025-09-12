import { Response } from 'express'
export const setCookie = (res: Response, accessToken: string, refreshToken: string) => {

    const maxAccessToken: number = parseInt(process.env.ACCESS_TOKEN_EXPIRES || "20000") || 20
    const maxRefreshToken: number = parseInt(process.env.REFRESH_TOKEN_EXPIRES || "20000") || 20
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: maxAccessToken });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxRefreshToken });
}