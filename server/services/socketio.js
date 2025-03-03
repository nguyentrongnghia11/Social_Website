
const socketio = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const getPublicKeyy = require('./getPublicKeyy');
const _conversation = require('../modules/conversation');
const _message = require('../modules/message');
const { on } = require('events');


const checkUserOnline = async (redis, id) => {
    const result = await redis.get(id);
    return result;
}

const changeDbs = async (redis, index) => {
    console.log('17')
    redis.select(index).then((err) => {
        if (err) {
            console.log('error', err);
        }
        console.log('select dbs', index)
    })
}



const socketioService = (app, redis) => {


    redis.flushAll().then(() => {
        console.log('Flushed');
    })
        .catch((err) => {
            console.log('Lỗi:', err);
        })


    const server = http.createServer(app)
    const io = socketio(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(socket.id, ' connected');

        socket.on('login', async (token) => {

            const key = await getPublicKeyy(token);



            const user = jwt.verify(token, key, async (err, user) => {
                if (err) {
                    console.log('error', err);
                    return;
                }
                else {

                    socket.user = user._doc._id;
                    await redis.set(user._doc._id, socket.id)
                }
            })

            console.log(socket.user)

            await changeDbs(redis, 1);
            console.log('67')


            const result = await redis.lRange(socket.user, 0, -1);

            console.log(result)

            if (result) {
                result.forEach(async (element) => {
                    const { content, conId } = JSON.parse(element);
                    io.to(socket.id).emit('chat', content, () => {
                        console.log('send to ', socket.id, ' success')
                    })
                })
            }
        })

        socket.on('chat', async (msg, receiverID) => {
            console.log('chat ' + msg)
            console.log('receiver', receiverID)

            const result = await checkUserOnline(redis, receiverID)

            console.log('result', result)

            //check online if online send by socket 

            if (result) {
                io.to(result).emit('chat', msg, () => {
                    console.log('send to ', result, ' success')

                })

                const checkConversation = await _conversation.findOne({
                    $or: [
                        { senderId: socket.user, receiverId: receiverID }, { senderId: receiverID, receiverId: socket.user }]
                });

                if (checkConversation) {
                    console.log('khoi tao 94')
                    const message = new _message({ conversationId: checkConversation._id, senderId: socket.user, content: msg })
                    await message.save();
                }
                else {

                    console.log('khoi tao 100')
                    const conversation = new _conversation({ senderId: socket.user, receiverId: receiverID })
                    conversation.save().then(async (result) => {
                        const message = new _message({ conversationId: conversation._id, senderId: socket.user, content: msg })
                        await message.save();
                    });
                }
            } else {

                console.log('offline')
                await changeDbs(redis, 1);
                const checkConversation = await _conversation.findOne({
                    $or: [
                        { senderId: socket.user, receiverId: receiverID }, { senderId: receiverID, receiverId: socket.user }]
                });
                if (checkConversation) {
                    const message = new _message({ conversationId: checkConversation._id, senderId: socket.user, content: msg })

                    await message.save();
                    const messageOffline = JSON.stringify({ content: msg, conId: checkConversation._id });
                    await redis.lPush(receiverID, messageOffline);
                }
                else {
                    const conversation = new _conversation({ senderId: socket.user, receiverId: result })
                    conversation.save().then(async (result) => {
                        const message = new _message({ conversationId: conversation._id, senderId: socket.user, message: msg })
                        await message.save();
                        const messageOffline = JSON.stringify({ content: msg, conId: checkConversation._id });
                        await redis.lPush(receiverID, messageOffline);
                    });
                }

                changeDbs(redis, 0)
            }

            // check offlien save to redis 

        })

        socket.on('disconnect', async () => {
            await redis.del(socket.id)

        })

    })

    return server;


}

module.exports = socketioService;