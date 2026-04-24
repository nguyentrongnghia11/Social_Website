
import { connectRabbitMQ } from "../src/databases/connectRabbitmq"
import 'dotenv/config';
import _Notification from "../src/models/notification";
import { handleNotification } from "../src/services/notification/notification.services";


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
