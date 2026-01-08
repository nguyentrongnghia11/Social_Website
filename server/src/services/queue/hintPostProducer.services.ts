import { connectRabbitMQ } from "../../databases/connectRabbitmq";
import { Post } from "../../models/post";


const INPUT_EXCHANGE2 = "hint-post-exchange"
const INPUT_QUEUE2 = "hint-post-queue"
const RESULT_QUEUE2 = "result-hint-post-queue"

export const hintPostProducer = async (post: Post) => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    await channel.assertExchange(INPUT_EXCHANGE2, "topic", { durable: true });
    await channel.assertQueue(INPUT_QUEUE2, { durable: true });
    await channel.bindQueue(INPUT_QUEUE2, INPUT_EXCHANGE2, INPUT_QUEUE2);

    channel.publish(INPUT_EXCHANGE2, INPUT_QUEUE2, Buffer.from(JSON.stringify(post)));

    console.log("✅ Post sent to queue:", post);

    setTimeout(() => {
        channel.close();
        connection.close();
    }, 500);
};