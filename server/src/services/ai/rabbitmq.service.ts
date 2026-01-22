import { Channel } from 'amqplib';
import { connectRabbitMQ } from '../../databases/connectRabbitmq';

let channel: Channel | null = null;

export async function getChannel(): Promise<Channel> {
    if (!channel) {
        const { connection } = await connectRabbitMQ();
        channel = await connection.createChannel();

    }
    return channel;
}

export async function publishToExchange(
    exchangeName: string,
    routingKey: string,
    message: any
): Promise<boolean> {
    try {
        const ch = await getChannel();
        await ch.assertExchange(exchangeName, 'direct', { durable: true });
        const sent = ch.publish(
            exchangeName,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        if (sent) {
            console.log(`📤 Published to exchange "${exchangeName}" with routing key "${routingKey}"`);
        }

        return sent;
    } catch (error) {
        console.error(`❌ Failed to publish to exchange "${exchangeName}":`, error);
        return false;
    }
}

export async function closeRabbitMQChannel(): Promise<void> {
    try {
        if (channel) {
            await channel.close();
            channel = null;
            console.log('✅ RabbitMQ channel closed');
        }
    } catch (error) {
        console.error('❌ Error closing RabbitMQ channel:', error);
    }
}
