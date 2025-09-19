import slowDown from "express-slow-down"

export const slowdown = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 20,
    delayMs: () => 500
})

