import { createClient } from 'redis'


const redisClient = createClient({
  url: process.env.REDIS_URI,
})

redisClient.on('error', (err) => {
  console.log('❌ Redis Client Error:', err.message);
  return;
});

const connection = async () => {
  await redisClient.connect().then(() => { console.log("Connect redis success") })
}

connection();


export default redisClient
