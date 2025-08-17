

import { buffer } from "stream/consumers";
import { connectRabbitMQ } from "../config/connectRabbitmq"



export const uploadProducer = async (files: string) => {

    const { connection } = await connectRabbitMQ();
    const chanel = await connection.createChannel()
    chanel.assertExchange(process.env.EXCHANGE_NAME || "", "direct", { durable: true })
    const rs = chanel.publish(process.env.EXCHANGE_NAME || "", process.env.EXCHANGE_NAME || "", Buffer.from(files))
    console.log('rs ', rs)
}


