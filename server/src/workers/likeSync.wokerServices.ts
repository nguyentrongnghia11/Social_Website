
import amqp from 'amqplib'
import { connectRabbitMQ } from '../databases/connectRabbitmq'
import _Post from '../models/post';
import connectMongo from '../databases/connectMongo';
import 'dotenv/config'; //
import { Types } from 'mongoose';

export async function likeSyncWoker() {

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
