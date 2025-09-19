import { connectRabbitMQ } from "../../databases/connectRabbitmq"
export const uploadProducer = async (files: string) => {
    const { connection } = await connectRabbitMQ();
    const chanel = await connection.createChannel()
    chanel.assertExchange(process.env.EXCHANGE_UPLOAD || "", "direct", { durable: true })
    const rs = chanel.publish(process.env.EXCHANGE_UPLOAD || "", process.env.EXCHANGE_NAME || "", Buffer.from(files))
}


