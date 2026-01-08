import { connectRabbitMQ } from "../../databases/connectRabbitmq";
import { Post } from "../../models/post";

const INPUT_EXCHANGE3 = "encode-post-exchange"
const INPUT_QUEUE3 = "encode-post-queue"
const RESULT_QUEUE3 = "result-encode-post-queue"

export const encodePostProducer = async (post: Post) => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    await channel.assertExchange(INPUT_EXCHANGE3, "direct", { durable: true });
    await channel.assertQueue(INPUT_QUEUE3, { durable: true });
    await channel.bindQueue(INPUT_QUEUE3, INPUT_EXCHANGE3, INPUT_QUEUE3);

    channel.publish(INPUT_EXCHANGE3, INPUT_QUEUE3, Buffer.from(JSON.stringify(post)));

    console.log("✅ Post sent to queue:", post);
};