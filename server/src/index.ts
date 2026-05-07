import express from 'express';
import mainRouter from './routes/server';
import connectMongo from './databases/connectMongo';
import config from './services/auth/servicesOauth2';
import cors from 'cors'
import http from 'http';
import { socketioService } from './services/socketIO.services'
import stragyVerifyLocal from './middleware/verifyToken';
import cookie from 'cookie-parser';
import { Server } from 'socket.io';
import { authSocket } from './middleware/authSocket';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv'
import { cors_conf } from './utils/cors-config';
import { errorHandling } from './middleware/handleError';
import { startWorkers } from '../workers/startWorker';
import { s3Client } from './databases/s3';


dotenv.config()

console.log("Starting JustVibing Server Deploy #3")


// run workers
startWorkers()

// init
const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);


// middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(cors(cors_conf));


// connect database
connectMongo();

// connect pub/sub
const pubClient = createClient({ url: process.env.REDIS_URI });
const subClient = pubClient.duplicate();

const connect = async () => {
  try {
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);
    console.log('Redis Pub/Sub connected successfully');
  } catch (error) {
    console.error('Redis Pub/Sub connection failed:', error);
    process.exit(1);
  }
}
connect();

export const io = new Server(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: cors_conf
});

// config passport
stragyVerifyLocal();
config(app);

// route socket
io.use(authSocket);
io.on('connection', socketioService)

mainRouter(app);

app.use(errorHandling)

const PORT = process.env.PORT || 8000;

// heath check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});




