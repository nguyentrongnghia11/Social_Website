import { Channel } from 'amqplib';
import { connectRabbitMQ } from "../../databases/connectRabbitmq"
import { IComment } from '../../models/comment';



const INPUT_EXCHANGE = "toxic-detect-exchange"
const INPUT_QUEUE = "toxic-detect-queue"
const RESULT_QUEUE = "result-detect-queue"




export const detectToxicProducer = async (comment: IComment) => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    await channel.assertExchange(INPUT_EXCHANGE, "direct", { durable: true });
    await channel.assertQueue(INPUT_QUEUE, { durable: true });
    await channel.bindQueue(INPUT_QUEUE, INPUT_EXCHANGE, INPUT_QUEUE);

    const message = JSON.stringify(comment);
    channel.publish(INPUT_EXCHANGE, INPUT_QUEUE, Buffer.from(message));

    console.log("✅ Message sent to queue:", message);
};


export const Producer = async (comment: Comment) => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    await channel.assertExchange(INPUT_EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(INPUT_QUEUE, { durable: true });
    await channel.bindQueue(INPUT_QUEUE, INPUT_EXCHANGE, INPUT_QUEUE);

    const message = JSON.stringify({ comment });
    channel.publish(INPUT_EXCHANGE, INPUT_QUEUE, Buffer.from(message));

    console.log("✅ Message sent to queue:", message);

    setTimeout(() => {
        channel.close();
        connection.close();
    }, 500);
};
