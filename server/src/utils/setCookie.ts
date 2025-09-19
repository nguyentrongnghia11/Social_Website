import { Response } from 'express'
export const setCookie = (res: Response, accessToken: string, refreshToken: string) => {

    console.log(process.env.ACCESS_TOKEN_EXPIRES)

    const maxAccessToken: number = parseInt(process.env.ACCESS_TOKEN_EXPIRES || "200000")
    const maxRefreshToken: number = parseInt(process.env.REFRESH_TOKEN_EXPIRES || "20000")
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 9000000});
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: maxRefreshToken });
}