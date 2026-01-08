import { Options } from './../../node_modules/express-rate-limit/dist/index.d';
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from 'express';

export const limiter = rateLimit ({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req: Request): string => {
        // Prioritize device ID, fallback to properly normalized IP
        const deviceId = req.headers["x-device-id"]?.toString();
        if (deviceId) return deviceId;
        
        // Use ipKeyGenerator helper to handle IPv6 correctly
        return ipKeyGenerator(req.ip || '');
    },
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