import { createClient } from 'redis'


const redisClient = createClient({
  url: process.env.REDIS_URI,
})

redisClient.on('error', (err) => {
  console.log ('REDIS_URI:', process.env.REDIS_URI);
  console.log('Redis Client Error:', err.message);
  return;
});

const connection = async () => {
  await redisClient.connect().then(() => { console.log("Connect redis success") })
}

connection();


export default redisClient

// Xóa tất cả key USER-ONLINE-SOCKET- khi server crash hoặc dừng
const cleanUserOnlineSocketKeys = async () => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys('USER-ONLINE-SOCKET-*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Deleted ${keys.length} USER-ONLINE-SOCKET-* keys from Redis.`);
    }
  } catch (err) {
    console.error('Error cleaning USER-ONLINE-SOCKET-* keys:', err);
  }
};

const shutdownHandler = async (signal:any) => {
  console.log(`Received ${signal}. Cleaning up USER-ONLINE-SOCKET-* keys...`);
  await cleanUserOnlineSocketKeys();
  process.exit(0);
};

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await cleanUserOnlineSocketKeys();
  process.exit(1);
});
process.on('exit', async () => {
  await cleanUserOnlineSocketKeys();
});
