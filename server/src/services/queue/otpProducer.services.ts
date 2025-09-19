import { buffer } from "stream/consumers";
import { connectRabbitMQ } from "../../databases/connectRabbitmq"


export const mailProducer = async (OTP: string, email: string) => {
    const { connection } = await connectRabbitMQ()
    const channel = await connection.createChannel();
    const exchangeName = process.env.EXCHANGE_OTP || "OTP_EXCHANGE"

    channel.assertExchange(exchangeName, "direct", { durable: true });

    channel.publish(exchangeName, "SEND-OTP", Buffer.from(JSON.stringify({ OTP, email })))
}