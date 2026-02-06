import amqplib, { Channel, ChannelModel } from 'amqplib';

let connectionPromise: Promise<{ connection: ChannelModel }> | null = null;

export const connectRabbitMQ = async () => {
    if (!connectionPromise) {
        connectionPromise = (async () => {

            console.log  ('Connecting to RabbitMQ... ', process.env.RABBIT_MQ_URI);
            const connection = await amqplib.connect(`${process.env.RABBIT_MQ_URI}`);
            console.log('Connected to RabbitMQ');
            return { connection };
        })();
    }
    return connectionPromise;
};
