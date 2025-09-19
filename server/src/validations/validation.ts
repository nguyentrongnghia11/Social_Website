import { NextFunction, Request, Response } from "express";
import {
    SigninSchema, TokenSchema,
    NotificationSchema, GroupSchema,
    UpdateCommentSchema, UpdatePostSchema,
    OtpSchema, ChangePasswordSchema,
    CreatePostSchema, SignupSchema,
    CreateCommentSchema
} from './schema.validations'

import { ErrorApi } from "../middleware/error";


const validateSignup = (req: Request, res: Response, next: NextFunction) => {

    const { error } = SignupSchema.validate(req.body)

    if (error) next(new ErrorApi(400, error.message))
    next()
}

const validateSignin = (req: Request, res: Response, next: NextFunction) => {


    const deviceId: string | undefined | string[] = req.headers["x-device-id"]
    const { error } = SigninSchema.validate({ ...req.body, deviceId }, {abortEarly: false})

    console.log ( {...req.body, deviceId })

    if (error) next(new ErrorApi(400, error.message))
    next()

}

const verifyAccountLocal = (req: Request, res: Response, next: NextFunction) => {
    const deviceId: string | undefined | string[] = req.headers["x-device-id"]
    const { error } = SigninSchema.validate({ ...req.body, deviceId })

    if (error) next(new ErrorApi(400, "Missing data"))
    next()


}

const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
    const deviceId: string | undefined | string[] = req.headers["x-device-id"]
    const { error } = ChangePasswordSchema.validate({ ...req.body, deviceId })

    if (error) next(new ErrorApi(400, "Missing data"))
    next()
}

const validateCreatePost = (req: Request, res: Response, next: NextFunction) => {

    const { error } = CreatePostSchema.validate(req.body)

    if (error) next(new ErrorApi(400, "Missing data"))
    next()

}
const validateUpdatePost = (req: Request, res: Response, next: NextFunction) => {
    const { error } = UpdatePostSchema.validate(req.body)

    if (error) next(new ErrorApi(400, "Missing data"))
    next()
}

const validateUpdateComment = (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.id
    const { error } = UpdatePostSchema.validate({ ...req.body, postId })
    if (error) next(new ErrorApi(400, "Missing data"))
    next()
}
const validateCreateGroup = (req: Request, res: Response, next: NextFunction) => {

    const { error } = GroupSchema.validate(req.body)
    if (error) next(new ErrorApi(400, "Missing data"))
    next()
}

const validateMarkedReadNotification = (req: Request, res: Response, next: NextFunction) => {
    const { error } = NotificationSchema.validate(req.body)
    if (error) next(new ErrorApi(400, "Missing data"))
    next()
}

const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const deviceId: string | undefined | string[] = req.headers["x-device-id"]
    const refreshTokenOld = req.cookies.refreshToken;

    const { error } = NotificationSchema.validate({ deviceId, refreshTokenOld })
    if (error) next(new ErrorApi(400, "Missing data"))
    next()

}

const validateCreateComment = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { error } = CreateCommentSchema.validate({ ...req.body, id })
    if (error) next(new ErrorApi(400, "Missing data"))
    next()

}


export {
    validateSignup, validateToken, validateChangePassword,
    validateUpdatePost, validateUpdateComment, validateCreateComment,
    validateCreateGroup, validateMarkedReadNotification,
    verifyAccountLocal, validateCreatePost, validateSignin
}