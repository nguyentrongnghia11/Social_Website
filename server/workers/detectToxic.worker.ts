import { connectRabbitMQ } from "../src/databases/connectRabbitmq";
import _Comment from "../src/models/comment"
import { InferenceClient } from "@huggingface/inference";

import 'dotenv/config';

const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN || '';
const HF_MODEL = 'unitary/toxic-bert';


const client = new InferenceClient(HF_API_TOKEN);

interface ToxicDetectionResult {
    label: string;
    score: number;
}

const INPUT_EXCHANGE = "toxic-detect-exchange";
const INPUT_QUEUE = "toxic-detect-queue";
const RESULT_QUEUE = "result-detect-queue";

async function detectToxic(text: string): Promise<string> {
    try {
        const output = await client.textClassification({
            model: HF_MODEL,
            inputs: text,
        });

        const topResult = output[0];
        const toxicLabels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];
        const isToxic = toxicLabels.includes(topResult.label) && topResult.score > 0.5;

        return isToxic ? 'toxic' : 'not_toxic';

    } catch (error: any) {
        throw new Error(`Toxic detection failed: ${error.message}`);
    }
}

export const detectToxicWorker = async () => {
    const { connection } = await connectRabbitMQ();
    const channel = await connection.createChannel();
    await channel.assertExchange(INPUT_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(INPUT_QUEUE, { durable: true });
    await channel.assertQueue(RESULT_QUEUE, { durable: true });

    await channel.bindQueue(INPUT_QUEUE, INPUT_EXCHANGE, INPUT_QUEUE);
    await channel.bindQueue(RESULT_QUEUE, INPUT_EXCHANGE, RESULT_QUEUE);

    await channel.prefetch(5);

    channel.consume(INPUT_QUEUE, async (msg) => {
        if (!msg?.content) {
            return;
        }

        try {
            const data = JSON.parse(msg.content.toString());
            const text = data.content || '';
            const commentId = data._id || data.commentId;

            const result = await detectToxic(text);
            if (commentId) {
                await _Comment.findByIdAndUpdate(commentId, {
                    isToxic: result
                });
            }
            channel.ack(msg);

        } catch (error: any) {
            channel.nack(msg, false, true);
        }
    }, { noAck: false });

    console.log(`[ToxicDetect] Worker ready. Listening on queue: ${INPUT_QUEUE}`);
};
