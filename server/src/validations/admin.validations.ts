import Joi from 'joi';

export const updateUserRoleSchema = Joi.object({
    role: Joi.string().valid('user', 'admin').required()
});

export const updateUserStatusSchema = Joi.object({
    status: Joi.string().valid('active', 'banned', 'suspended').required()
});

export const updatePostVisibilitySchema = Joi.object({
    status: Joi.string().valid('published', 'hidden').required()
});

export const updateCommentVisibilitySchema = Joi.object({
    status: Joi.string().valid('published', 'hidden').required()
});

export const addBannedWordSchema = Joi.object({
    word: Joi.string().min(1).max(100).required(),
    category: Joi.string().valid('spam', 'hate-speech', 'fraud', 'adult').required()
});

export const updateReportStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
    reviewNote: Joi.string().max(500).optional()
});

export const rejectReportSchema = Joi.object({
    reason: Joi.string().min(1).max(500).required()
});

export const banUserSchema = Joi.object({
    reason: Joi.string().min(1).max(500).optional()
});

export const createBroadcastSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('info', 'warning', 'success', 'error').required()
});

export const createBannerSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    position: Joi.string().valid('top', 'bottom', 'sidebar', 'popup').required(),
    imageUrl: Joi.string().uri().required(),
    link: Joi.string().uri().optional().allow(''),
    active: Joi.boolean().default(true),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    order: Joi.number().integer().min(0).default(0)
});

export const updateBannerSchema = Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    position: Joi.string().valid('top', 'bottom', 'sidebar', 'popup').optional(),
    imageUrl: Joi.string().uri().optional(),
    link: Joi.string().uri().optional().allow(''),
    active: Joi.boolean().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    order: Joi.number().integer().min(0).optional()
});

export const createSecurityAlertSchema = Joi.object({
    type: Joi.string().valid('suspicious-login', 'multiple-failed-attempts', 'ddos-attempt', 'malicious-content', 'other').required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    description: Joi.string().min(1).max(500).required(),
    userId: Joi.string().optional(),
    metadata: Joi.object().optional()
});

export const updateSecurityAlertSchema = Joi.object({
    status: Joi.string().valid('open', 'acknowledged', 'resolved', 'false-positive').required()
});

export const updateSettingsSchema = Joi.object({
    siteName: Joi.string().min(1).max(100).optional(),
    contactEmail: Joi.string().email().optional(),
    maintenanceMode: Joi.boolean().optional(),
    allowRegistration: Joi.boolean().optional(),
    allowGoogleAuth: Joi.boolean().optional(),
    maxUploadSize: Joi.number().integer().min(1024).max(104857600).optional(), // 1KB to 100MB
    allowedFileTypes: Joi.array().items(Joi.string()).optional(),
    moderationEnabled: Joi.boolean().optional(),
    autoModeration: Joi.boolean().optional()
});
