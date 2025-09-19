import Joi from "joi";

export const EmailField = Joi.string().email().required();

export const PasswordField = Joi.string().required();
    // .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$"))
    // .required()
    // .messages({
    //     "string.pattern.base": "Password phải ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
    //     "any.required": "Password là bắt buộc",
    // });

export const UsernameField = Joi.string().min(6).max(30).required();

export const DeviceIDField = Joi.string().required()
export const RoleField = Joi.string().default(Joi.ref("user"))

export const IDField = Joi.string().length(12).required()
export const TitleField = Joi.string()
    .pattern(/^(\S+\s+){0,19}\S+$/)
    .required()
    .messages({
        'string.pattern.base': 'Tiêu đề không được vượt quá 20 từ',
        'any.required': 'Tiêu đề là bắt buộc',
    })
