import { Token } from './../models/token';
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { EmailField, PasswordField, UsernameField, DeviceIDField, RoleField, IDField, TitleField } from "./commonField.validations";
import { JSONCookies } from "cookie-parser";

const SignupSchema = Joi.object({
    otpCode: Joi.number(),
    email: Joi.string().required(),
    username: Joi.string().default(Joi.ref("email")),
    password: PasswordField,
    role: RoleField
})

const SigninSchema = Joi.object({
    email: EmailField,
    password: PasswordField,
    deviceId: DeviceIDField
})

const OtpSchema = Joi.object({
    otpCode: Joi.number().integer().min(100000).max(999999),
    email: EmailField,
    username: UsernameField,
    password: PasswordField,
    role: RoleField,
    deviceId: DeviceIDField
})

const ChangePasswordSchema = Joi.object({
    email: EmailField,
    oldPassword: PasswordField,
    newPassword: PasswordField,
    confirmPassword: PasswordField,
    deviceId: DeviceIDField
})

const CreatePostSchema = Joi.object({
    title: TitleField,
    content: Joi.string().required()
})
const UpdatePostSchema = Joi.object({
    title: TitleField,
    files: Joi.array().items(Joi.object()),
    content: Joi.string().required()
})

const UpdateCommentSchema = Joi.object({
    id: IDField,
    content: Joi.string().required()
})

const GroupSchema = Joi.object({


    name: Joi.string().required(),
    isPrivate: Joi.boolean().required(),
    members: Joi.array().required()

})

const NotificationSchema = Joi.object({
    notificationId: IDField,
    reciveId: IDField
})

const TokenSchema = Joi.object({
    deviceId: DeviceIDField,
    refreshTokenOld: Joi.string().required()
})

const CreateCommentSchema = Joi.object({
    id: IDField,
    content: Joi.string().required(),
     parentID: Joi.string().allow(null, "").default(null)
})

export {
    SigninSchema, TokenSchema,
    NotificationSchema, GroupSchema,
    UpdateCommentSchema, UpdatePostSchema,
    OtpSchema, ChangePasswordSchema,
    CreatePostSchema, SignupSchema,
    CreateCommentSchema
}