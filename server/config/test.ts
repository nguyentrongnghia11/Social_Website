

import { connectRabbitMQ } from './connectRabbitmq'



const test = async () => {
    try {
        const result = await connectRabbitMQ();

        if (!result) {
            throw new Error("connectionMq trả về undefined");
        }

        // const { connection } = result;
        console.log("Kết nối thành công RabbitMQ!");
    } catch (err) {
        console.error("Không kết nối được RabbitMQ:", err);
    }

}


export default test

