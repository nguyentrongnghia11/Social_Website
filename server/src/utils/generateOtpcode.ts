
import nodeMailer from 'nodemailer';
import genotp from 'otp-generator';
import _Otp from '../models/otp';

export const generateOtpcode = async () => {
    const otpCode = genotp.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    })
    return otpCode;
}
