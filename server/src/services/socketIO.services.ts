
import _Conversation from '../models/conversation';
import _Message from '../models/message';
import redisClient from '../databases/connectRedis';
import { Socket } from 'socket.io';
import _Notifycation from '../models/notification';
import _Group from '../models/group';

const keyUserOnline = "USER-ONLINE-SOCKET-";

const checkUserOnline = async (id: string) => {
    const result = await redisClient.sMembers(`${keyUserOnline}${id}`);
    console.log ("result ", result)
    return result || [];
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
        console.log (msg, receiverID)
        let isOnline: string[];
        let existsConvention = await _Conversation.findOne({ _id: msg.conversationId }).lean();
        console.log("exists ", existsConvention)
        // if mess of group 
        const convention = existsConvention
            ? existsConvention
            : msg.type === "user" ? (await (new _Conversation({ senderId: socket.user?.id, receiverId: receiverID, type: "user" })).save())
                : (await (new _Conversation({ groupId: receiverID, type: "group" })).save());

        const message = await _Message.create({ conversationId: convention._id, senderId: socket.user?.id, content: msg.content, contentType: msg.contentType, type: msg.type })
        if (msg.type === 'group') {
            console.log("Dang goi")
            const groupId: string = convention.groupId.toString()
            console.log(groupId)

            await _Conversation.findOneAndUpdate({ _id: convention._id }, { updatedAt: new Date() })
            socket.to(groupId).emit("chat-group", msg)
        }
        else {
            if (!convention) {
                return;
            }
            const receiver: string = socket.user?.id === convention?.senderId.toString() ? convention?.receiverId.toString() : convention?.senderId.toString()
            isOnline = await checkUserOnline(receiver)
            if (isOnline?.length > 0) {
                await _Conversation.findOneAndUpdate({ _id: convention._id }, { updatedAt: new Date() })
                for (const uid of isOnline) {
                    socket.to(uid).emit('chat', msg)
                }
                console.log('send message online')
            } else {
                await redisClient.rPush(`unread:${receiverID}`, JSON.stringify(msg));
            }

        }

    })

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

