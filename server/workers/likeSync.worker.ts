
import amqp from 'amqplib'
import { connectRabbitMQ } from '../src/databases/connectRabbitmq'
import _Post from '../src/models/post';
import connectMongo from '../src/databases/connectMongo';
import 'dotenv/config';

export async function likeSyncWorker() {

    console.log('likeSyncWoker start')

    await connectMongo();

    const { connection } = await connectRabbitMQ()
    const chanel = await connection.createChannel()


    const queue = "post:like"
    chanel.assertQueue(queue, {
        durable: true
    })


    chanel.consume(queue, async function (data) {

        const postConvert: any = data?.content.toString()

        const post = JSON.parse(postConvert)


        const updated = await _Post.findByIdAndUpdate(
            { _id: post.postId },
            {
                $addToSet: {
                    react: {
                        $each: post.react
                    }
                }
            }
        );
        console.log(updated)
    }, {
        noAck: true
    })
}
