import express from 'express';
import mainRouter from './routes/server';
import connectMongo from './databases/connectMongo';
import { uploadWoker } from './workers/wokerServices';
import { likeSyncWoker } from './workers/likeSync.wokerServices';
import config from './services/servicesOauth2';
import cors from 'cors'
import http from 'http';
import { likeSyncCron } from './services/likeSyncProducer.services';
import { socketioService } from './services/socketIO.services'
import stragyVerifyLocal from './middleware/verifyToken_services';
import cookie from 'cookie-parser';
import { Server } from 'socket.io';
import { authSocket } from './middleware/authSocket';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv'
import { cors_conf } from './utils/cors-config';

dotenv.config()


// run worker
likeSyncWoker()
uploadWoker()

// init
const app = express();
const server = http.createServer(app);

// middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(cors(cors_conf));


// connect database
connectMongo();

// connect pub/sub
const pubClient = createClient({ url: process.env.REDIS_URI });
const subClient = pubClient.duplicate()
const connect = async () => {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ])
}
connect();

export const io = new Server(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: cors_conf
});

// config passport
stragyVerifyLocal();
config(app);
likeSyncCron();

// route socket
io.use(authSocket);
io.on('connection', socketioService)

mainRouter(app);

server.listen(process.env.PORT || 8000, () => {
  console.log('Server is running on port ' + process.env.PORT || 8000);
})




