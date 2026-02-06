import { connectRabbitMQ } from "../src/databases/connectRabbitmq"
import nodeMailer from 'nodemailer';
import _Otp from "../src/models/otp";

export const sendOtpWorker = async () => {
    try {
        const { connection } = await connectRabbitMQ();
        const channel = await connection.createChannel();

        const exchangeName = process.env.EXCHANGE_OTP || "OTP_EXCHANGE"
        const queueName = process.env.QUEUE_OTP || "OTP_EXCHANGE"

        await channel.assertExchange(exchangeName, "direct", { durable: true })
        await channel.assertQueue(queueName, { messageTtl: 60000 })
        await channel.bindQueue(queueName, exchangeName, "SEND-OTP")

        channel.consume(queueName, async (msg) => {
            if (msg?.content) {
                try {
                    const { OTP, email } = JSON.parse(msg?.content.toString());
                    const otp = new _Otp({
                        email,
                        otp: parseInt(OTP)
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

                    const htmlTemplate = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .header { text-align: center; color: #333; }
                                .otp-box { background: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; letter-spacing: 8px; }
                                .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="header">Xác thực tài khoản</h1>
                                <p>Chào bạn,</p>
                                <p>Mã OTP của bạn để xác thực tài khoản là:</p>
                                <div class="otp-box">${OTP}</div>
                                <p><strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong 2 phút.</p>
                                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                                <div class="footer">
                                    <p>Trân trọng,<br/>Nghiahoasi Company</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;

                    const info = await trans.sendMail({
                        from: `"Nghiahoasi Company" <${process.env.EMAIL}>`,
                        to: email,
                        subject: "Mã OTP xác thực tài khoản",
                        text: `Mã OTP của bạn là: ${OTP}. Mã này có hiệu lực trong 2 phút.`,
                        html: htmlTemplate,
                    });

                    console.log(`otp sent successfully to ${email}. Message ID: ${info.messageId}`);
                } catch (error) {
                    console.error('error processing OTP message:', error);
                }
            }
        }, { noAck: true })
    } catch (error) {
        throw error;
    }
}