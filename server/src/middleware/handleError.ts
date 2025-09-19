import { NextFunction, Request, Response } from "express";

import { getReasonPhrase, StatusCodes } from "http-status-codes";
import message from "../models/message";
import { ErrorApi } from "./error";


export const errorHandling = (err: ErrorApi, req: Request, res: Response, next: NextFunction) => {

    if (!err?.statusCode || null) {
        err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    }

    const responseError = {
        message: err.message || getReasonPhrase(err.statusCode),
        stack: err.stack,
        statusCode: err.statusCode
    }
    return res.status(responseError.statusCode).json(responseError)

}
