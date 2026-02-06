import { connectRabbitMQ } from "../src/databases/connectRabbitmq";
import { InferenceClient } from "@huggingface/inference";
import _Post from "../src/models/post";
import 'dotenv/config';

const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN || '';
const HF_EMBEDDING_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const client = new InferenceClient(HF_API_TOKEN);

async function encodePost(text: string): Promise<number[]> {
    try {
        const output = await client.featureExtraction({
            model: HF_EMBEDDING_MODEL,
            inputs: text,
        });
        const embedding = Array.isArray(output[0]) ? output[0] : output;
        return embedding as number[];

    } catch (error: any) {
        throw new Error(`Cannot generate embedding: ${error.message}`);
    }
}

export const encodePostWorker = async () => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();

    const INPUT_EXCHANGE = process.env.ENCODE_POST_EXCHANGE || "encode-post-exchange";
    const INPUT_QUEUE = process.env.ENCODE_POST_QUEUE || "encode-post-queue";
    const RESULT_QUEUE = process.env.ENCODE_RESULT_QUEUE || "result-encode-post-queue";

    await channel.assertExchange(INPUT_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(INPUT_QUEUE, { durable: true });
    await channel.assertQueue(RESULT_QUEUE, { durable: true });

    await channel.bindQueue(INPUT_QUEUE, INPUT_EXCHANGE, INPUT_QUEUE);
    await channel.bindQueue(RESULT_QUEUE, INPUT_EXCHANGE, RESULT_QUEUE);

    await channel.prefetch(1);

    channel.consume(INPUT_QUEUE, async (msg) => {
        if (!msg?.content) {
            return;
        }

        try {
            const data = JSON.parse(msg.content.toString());
            const content = data.content || '';
            const postId = data._id || data.postId;

            if (!postId || !content) {
                console.warn('[Encode] Missing postId or content, skipping...');
                channel.ack(msg);
                return;
            }
            const embedding = await encodePost(content);

            await _Post.findByIdAndUpdate(postId, {
                embedding: embedding
            });
            const response = {
                id: postId,
                status: 'success'
            };

            await channel.publish(
                INPUT_EXCHANGE,
                RESULT_QUEUE,
                Buffer.from(JSON.stringify(response)),
                { persistent: true }
            );

            channel.ack(msg);

        } catch (error: any) {
            channel.ack(msg);
        }
    }, { noAck: false });

    console.log(`[Encode] Worker ready. Listening on queue: ${INPUT_QUEUE}`);
};
