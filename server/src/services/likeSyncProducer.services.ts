import cron from 'node-cron';
import { connectRabbitMQ } from '../databases/connectRabbitmq';
import redisClient from '../databases/connectRedis';

export async function likeSyncCron() {
    const { connection } = await connectRabbitMQ(); // Kết nối 1 lần, không tạo lại mỗi phút
    const channel = await connection.createChannel()
    const queue = "post:like";
    const keyPostLike = "post:like:";

    await channel.assertQueue(queue, {
        durable: true
    });

    cron.schedule('0 * * * *', async () => {
        console.log('schedule')
        try {
            const postKeys = await redisClient.KEYS(`${keyPostLike}*`);

            for (const key of postKeys) {
                const postID = key.replace(keyPostLike, '');
                const react = await redisClient.SMEMBERS(key);

                const data = { postId: postID, react };

                channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
                    persistent: true
                });

                console.log(`⏳ Sent like data for post: ${postID}`);
            }

        } catch (err) {
            console.error('❌ Cron job error:', err);
        }
    });
}
