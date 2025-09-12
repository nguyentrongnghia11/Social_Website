

const socketio = require('socket.io');
const http = require('http');
import jwt from 'jsonwebtoken';
import _Conversation from '../models/conversation';
import _Message from '../models/message';
const { on } = require('events');
import redisClient from '../databases/connectRedis';
import { IUser } from '../models/user';
import { Socket } from 'socket.io';
import { IMessage } from '../models/message';
import { redis } from 'googleapis/build/src/apis/redis';
import _Notifycation from '../models/notification';
import { sendEventDevice } from './notification.services';
import _Group from '../models/group';
import { ObjectId } from 'mongoose';
import { group } from 'console';

const keyUserOnline = "USER-ONLINE-SOCKET-";

const checkUserOnline = async (id: string) => {
    const result = await redisClient.sMembers(`${keyUserOnline}${id}`);
    return result || [];
}

const changeDbs = async (index: number) => {
    console.log('17')
    redisClient.select(index).then((err: any) => {
        if (err) {
            console.log('error', err);
        }
        console.log('select dbs', index)
    })
}



export const socketioService = async (socket: Socket) => {


    socket.on('join-group', async (groupId) => {
        console.log("join group ", groupId);
        socket.join(`group:${groupId}`)
        await redisClient.sAdd(`group:${groupId}`, socket.id)
        socket.broadcast.to(`group:${groupId}`).emit("new-member", { content: "nguyen trong nghia da tham gia" })
    })

    // redisClient.flushAll()
    //     .then(() => {
    //         console.log('Flushed');
    //     })
    //     .catch((err) => {
    //         console.log('Lỗi:', err);
    //     })
    // console.log('Socket auth2::: ', socket.id);
    const listMessage = await redisClient.lRange(`unread:${socket.user?.id}`, 0, -1)
    //console.log(listMessage)


    listMessage.forEach((t: any) => {
        const data = JSON.parse(t)
        socket.emit('chat', data.content, () => {
            console.log('Send message offline succcess')
        }
        )
    })

    await redisClient.del(`unread:${socket.user?.id}`)



    socket.on('chat', async (msg, receiverID) => {


        console.log('chat ' + msg.type)
        console.log('sender', socket.user?.id)
        console.log('sender', receiverID)
        let isOnline: string[];
        let existsConvention = await _Conversation.findOne({ _id: msg.conversationId }).lean();
        console.log("exists ", existsConvention)
        // if mess of group 
        const convention = existsConvention
            ? existsConvention
            : msg.type === "user" ? (await (new _Conversation({ senderId: socket.user?.id, receiverId: receiverID, type: "user" })).save())
                : (await (new _Conversation({ groupId: receiverID, type: "group" })).save());

        const message = await _Message.create({ conversationId: convention._id, senderId: socket.user?.id, content: msg.content, contentType: msg.contentType, type: msg.type })

        console.log("convention ", convention)

        if (msg.type === 'group') {
            console.log("Dang goi")
            const groupId: string = convention.groupId.toString()
            console.log(groupId)
            socket.to(groupId).emit("chat-group", msg)
        }
        else {
            if (!convention) {
                return;
            }
            const receiver: string = socket.user?.id === convention?.senderId.toString() ? convention?.receiverId.toString() : convention?.senderId.toString()
            isOnline = await checkUserOnline(receiver)

            console.log('day la isonline ', isOnline)

            if (isOnline?.length > 0) {
                console.log('send message online')
                for (const uid of isOnline) {
                    socket.to(uid).emit('chat', msg)
                }
            } else {
                await redisClient.rPush(`unread:${receiverID}`, JSON.stringify(msg));
            }

        }

    })

    // socket.on("listen-keyboard", (msg,receiverID )) {

    // }

    // { senderId: conversation.type === "group" ? conversation.groupId._id : conversation.receiverId?._id, name: user.name },
    socket.on('typing', async (content) => {
        console.log("recevier id ", content)
        let isOnline: string[] = []
        if (content.type === "user") {

            isOnline = await checkUserOnline(content.receiverId)
            console.log(isOnline)

            if (isOnline?.length > 0) {
                console.log('send listen keyboard message online')
                for (const uid of isOnline) {
                    socket.to(uid).emit('typing', content)
                }
            }
        }
        else {
            socket.to(content.receiverId).emit("typing", content)
        }
    })


    socket.on('disconnect', async () => {
        await redisClient.SREM(`${keyUserOnline}${socket.user?.id}`, socket.id)
    })
}

