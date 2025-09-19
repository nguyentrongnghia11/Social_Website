import { connectRabbitMQ } from "../src/databases/connectRabbitmq"
import nodeMailer from 'nodemailer';
import _Otp from "../src/models/otp";

export const sendOtpWorker = async () => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    const exchangeName = process.env.EXCHANGE_OTP || "OTP_EXCHANGE"
    const queueName = process.env.QUEUE_OTP || "OTP_EXCHANGE"

    channel.assertExchange(exchangeName, "direct", { durable: true })
    channel.assertQueue(queueName, { messageTtl: 60000 })
    channel.bindQueue(queueName, exchangeName, "SEND-OTP")

    channel.consume(queueName, async (msg) => {
        if (msg?.content) {
            console.log(msg.content);
            const { OTP, email } = JSON.parse(msg?.content.toString());
            const otp = new _Otp({
                email,
                otp: OTP
            })
            await otp.save();
            const trans = nodeMailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                }
            })

            const info = await trans.sendMail({
                from: '"Nghiahoasi Company" <nghianguyen15012004@gmail.com>',
                to: email,
                subject: "Your otp",
                text: OTP,
                html: OTP,
            });
        }
    }, { noAck: true })
}