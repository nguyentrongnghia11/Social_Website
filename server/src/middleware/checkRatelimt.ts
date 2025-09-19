import { Options } from './../../node_modules/express-rate-limit/dist/index.d';
import rateLimit from "express-rate-limit";

export const limiter = rateLimit ({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Bạn gửi quá nhiều request. Hãy thử lại sau 15 phút.",
    skipFailedRequests : true,
    skipSuccessfulRequests: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message : options.message,
            retryAfter: Math.ceil (options.windowMs/ 1000)
        })
    }

})