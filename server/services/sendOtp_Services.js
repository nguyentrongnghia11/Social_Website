
const nodeMailer = require('nodemailer');
const genotp = require('otp-generator');
const { options } = require('../routes/auth');
const _otp = require('../modules/otp');
const getPublicKeyy = require('./getPublicKeyy');



const sendOtp = async (email) => {
    const otpCode = genotp.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,

    })
    console.log(otpCode);

    const otp = new _otp({
        email,
        otp: otpCode
    })

    await otp.save();


    const trans = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }

    })


    const info = await trans.sendMail({
        from: '"Nghiahoasi Company" <nghianguyen15012004@gmail.com>',
        to: email,
        subject: "Your otp",
        text: otpCode,
        html: otpCode, // html body
    });


    if (info) {
        return {
            status: 200,
            otp: otpCode,
            message: 'Send otp success'
        }
    }

    return {
        status: 400,
        message: 'Send otp failed'
    }


}


module.exports = sendOtp;