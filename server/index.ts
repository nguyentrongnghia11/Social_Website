import express, { NextFunction, Request, Response } from 'express';
const app = express();
var admin = require("firebase-admin");
const mainRouter = require('./routes/server');
import connectMongo from './config/connectMongo';
import { uploadWoker } from './wokerServices';
import { likeSyncWoker } from './likeSync.wokerServices';


const config = require('./services/servicesOauth2');
import cors from 'cors'

import http from 'http';
import test from './config/test';
import { likeSyncCron } from './services/likeSyncProducer.services';
import { socketioService } from './services/socketIO.services'

import passport from "passport";
import p from './middleware/verifyToken_services';
const cookie = require('cookie-parser');
import { Server } from 'socket.io';
import { authSocket } from './middleware/authSocket';
import redisClient from './config/connectRedis';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import dotenv from 'dotenv'
dotenv.config()

const server = http.createServer(app);

likeSyncWoker()
uploadWoker()

// Extend the Socket type to include a 'user' property

declare module "socket.io" {
  interface Socket {
    user?: string;
  }
}

const pubClient = createClient({ url: process.env.REDIS_URI });
const subClient = pubClient.duplicate()


const connect = async () => {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ])
}

connect()

export const io = new Server(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
  }
});






io.use(authSocket);

io.on('connection', socketioService)


// Configure express middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());

// Initialize passport after express middleware


p(app);
config(app);
likeSyncCron();



app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],

}));



connectMongo();
test();
mainRouter(app);

server.listen(process.env.PORT || 8000, () => {
  console.log('Server is running on port ' + process.env.PORT || 8000);
})




