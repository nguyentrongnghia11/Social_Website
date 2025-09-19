
import { connectRabbitMQ } from "../src/databases/connectRabbitmq"
import 'dotenv/config';
import { handleImageUploadAndUpdate } from "../src/services/upload/handleImageUploadAndUpdate .services";
import _Notification from "../src/models/notification";
import { io } from "../src";
import redisClient from "../src/databases/connectRedis";
import { handleNotification } from "../src/services/notification/handleNotification.services";

export const uploadWorker = async () => {


    console.log("Upload service is running")
    const { connection } = await connectRabbitMQ()
    const chanel = await connection.createChannel();

    const queue_name = process.env.QUEUE_UPLOAD || "";
    const exchange_name = process.env.EXCHANGE_UPLOAD || ""

    chanel.assertExchange(exchange_name, "direct", { durable: true })

    chanel.assertQueue(queue_name, { durable: true })
    chanel.bindQueue(queue_name, exchange_name, exchange_name)

    chanel.consume(queue_name, async function (msg) {

        if (!msg?.content) {
            return
        }

        else if (msg?.content) {
            try {
                const data = JSON.parse(msg.content.toString());
                await handleImageUploadAndUpdate(data)
                const listDevice = await redisClient.sMembers(`USER-ONLINE-SOCKET-${data.uid}`);
                for (const device of listDevice) {
                    io.to(device).emit("post:uploaded", { postId: data.postId });
                }
                chanel.ack(msg)

            } catch (error) {
                console.error('Lỗi khi xử lý queue:', error);
                chanel.nack(msg)
            }
        }

    }, { noAck: false })
}


export const notificationWoker = async () => {

    const queue_name = "notice_queue"
    const exchange_name = "notice_exchange"

    const { connection } = await connectRabbitMQ();

    const chanel = await connection.createChannel()

    chanel.assertExchange(exchange_name, 'direct');

    chanel.assertQueue(queue_name, { durable: true })

    chanel.bindQueue(queue_name, exchange_name, "notification")


    chanel.consume(queue_name, async (msg) => {
        if (!msg || !msg.content) {
            return;
        }
        let message;

        try {

            message = JSON.parse(msg.content.toString())
        } catch (error) {
            console.error(error + 'work services file')
        }
        handleNotification(message)
    }, { noAck: true })
}
