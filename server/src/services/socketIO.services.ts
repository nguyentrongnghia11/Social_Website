import _Conversation from '../models/conversation';
import _Message from '../models/message';
import redisClient from '../databases/connectRedis';
import { Socket } from 'socket.io';
import _Notifycation from '../models/notification';
import _Group from '../models/group';
import _Call from '../models/call';
import groupService from "../services/group/group.services";
import callService from "./call/call.services";

declare module "socket.io" {
    interface Socket {
        user?: { id: string; name: string; groups: string[] };
    }
}

const KEY_USER_ONLINE_SOCKET = "USER-ONLINE-SOCKET-";
const KEY_GROUP_PREFIX = "group:";
const KEY_UNREAD_COUNT = "unread-count:";

const checkUserOnline = async (receiverID: string): Promise<string[]> => {
    try {
        return await redisClient.sMembers(`${KEY_USER_ONLINE_SOCKET}${receiverID}`) || [];
    } catch (error) {
        console.error(`Error checking user online status:`, error);
        return [];
    }
}

const joinConversationRoom = async (socket: Socket, conversationId: string) => {
    socket.join(conversationId);
    await redisClient.sAdd(`${KEY_GROUP_PREFIX}${conversationId}`, socket.id);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
}

const emitToOnlineUsers = async (socket: Socket, userIds: string[], event: string, data: any) => {
    const promises = userIds.map(async (userId) => {
        const socketIds = await checkUserOnline(userId);
        socketIds.forEach(socketId => {
            if (socketId !== socket.id) {
                socket.to(socketId).emit(event, data);
            }
        });
    });
    await Promise.all(promises);
}

const incrementUnreadCounts = async (conversationId: string, memberIds: string[], senderId: string) => {
    const pipeline = redisClient.multi();
    memberIds.forEach(memberId => {
        if (memberId !== senderId) {
            pipeline.incr(`${KEY_UNREAD_COUNT}${memberId}:${conversationId}`);
        }
    });
    await pipeline.exec();
}

const handleExistingConversation = async (socket: Socket, msg: any, conversation: any) => {
    try {
        const message = await _Message.create({
            conversationId: conversation._id,
            senderId: msg.senderId,
            content: msg.content,
            contentType: msg.contentType || 'text',
            type: conversation.type
        });

        if (!message) {
            throw new Error('Failed to create message');
        }

        await _Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: message._id,
            updatedAt: new Date()
        });

        const messageData = {
            msg: {
                ...msg,
                name: msg.nameSender || 'Unknown',
                conversationId: conversation._id.toString(),
                senderName: msg.nameSender
            }
        };

        socket.to(conversation._id.toString()).emit("chat", messageData);

        let memberIds: string[] = [];
        if (conversation.type === 'group' && conversation.groupId) {
            const group = await _Group.findById(conversation.groupId).select('members').lean();
            memberIds = (group?.members || []).map((id: any) => id.toString());
        } else {
            memberIds = [
                conversation.senderId?.toString(),
                conversation.receiverId?.toString()
            ].filter(Boolean);
        }

        await incrementUnreadCounts(conversation._id.toString(), memberIds, msg.senderId);

        return { success: true, conversationId: conversation._id };
    } catch (error) {
        console.error('Error handling existing conversation:', error);
        return { success: false, error: (error as Error).message };
    }
}

const handleNewUserConversation = async (socket: Socket, msg: any) => {
    try {
        if (!msg.senderId || !msg.receiverId) {
            throw new Error('Missing senderId or receiverId');
        }

        // Check existing
        const existing = await _Conversation.findOne({
            type: 'user',
            $or: [
                { senderId: msg.senderId, receiverId: msg.receiverId },
                { senderId: msg.receiverId, receiverId: msg.senderId }
            ]
        }).populate('senderId receiverId', 'name email avatar').lean();

        if (existing) {
            socket.emit('conversationCreated', {
                conversationId: existing._id,
                conversation: existing
            });
            return await handleExistingConversation(socket, { ...msg, conversationId: existing._id }, existing);
        }

        // Create new
        const nConversation = await new _Conversation({
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            type: "user"
        }).save();

        const populatedConversation = await _Conversation.findById(nConversation._id)
            .populate('senderId receiverId', 'name email avatar')
            .lean();

        const message = await _Message.create({
            conversationId: nConversation._id,
            senderId: msg.senderId,
            content: msg.content,
            contentType: msg.contentType || 'text',
            type: 'user'
        });

        await _Conversation.findByIdAndUpdate(nConversation._id, {
            lastMessage: message._id,
            updatedAt: new Date()
        });

        await joinConversationRoom(socket, (nConversation._id as any).toString());

        // Notify sender
        socket.emit('conversationCreated', {
            conversationId: nConversation._id,
            conversation: populatedConversation
        });

        // Notify receiver
        const receiverSocketIds = await checkUserOnline(msg.receiverId);
        if (receiverSocketIds.length > 0) {
            const messageData = {
                msg: {
                    ...msg,
                    name: msg.nameSender || 'Unknown',
                    conversationId: (nConversation._id as any).toString(),
                    senderName: msg.nameSender
                }
            };
            receiverSocketIds.forEach(socketId => {
                socket.to(socketId).emit('chat', messageData);
                socket.to(socketId).emit('conversationCreated', {
                    conversationId: nConversation._id,
                    conversation: populatedConversation
                });
            });
        }

        await redisClient.incr(`${KEY_UNREAD_COUNT}${msg.receiverId}:${nConversation._id}`);

        return { success: true, conversationId: nConversation._id };
    } catch (error) {
        console.error('Error handling new user conversation:', error);
        socket.emit('error', { message: 'Failed to create conversation' });
        return { success: false, error: (error as Error).message };
    }
}

const handleNewGroupConversation = async (socket: Socket, msg: any) => {
    try {
        if (!msg.senderId || !msg.groupName || !msg.memberIds || msg.memberIds.length < 2) {
            throw new Error('Invalid group data');
        }

        const { newGroup, newConversation } = await groupService.createGroup(
            msg.senderId,
            msg.groupName,
            true,
            msg.memberIds
        );

        if (!newGroup || !newConversation) {
            throw new Error('Failed to create group');
        }

        const populatedConversation = await _Conversation.findById(newConversation._id)
            .populate({
                path: 'groupId',
                populate: {
                    path: 'members',
                    select: 'name email avatar'
                }
            })
            .lean();

        const firstMessage = await _Message.create({
            conversationId: newConversation._id,
            senderId: msg.senderId,
            content: msg.content || `Đã tạo nhóm "${msg.groupName}"`,
            contentType: 'text',
            type: 'group'
        });

        await _Conversation.findByIdAndUpdate(newConversation._id, {
            lastMessage: firstMessage._id,
            updatedAt: new Date()
        });

        await joinConversationRoom(socket, newConversation._id.toString());

        // Notify creator
        socket.emit('conversationCreated', {
            conversationId: newConversation._id,
            conversation: populatedConversation
        });

        const groupChatMsg = {
            msg: {
                type: "group",
                name: msg.groupName,
                members: msg.memberIds,
                senderId: msg.senderId,
                nameSender: msg.nameSender || 'Unknown',
                senderName: msg.nameSender || 'Unknown',
                content: msg.content || `Đã tạo nhóm "${msg.groupName}"`,
                conversationId: newConversation._id.toString(),
                groupId: (newGroup._id as any).toString()
            }
        };

        // Notify all members except creator
        await emitToOnlineUsers(
            socket,
            msg.memberIds.filter((id: string) => id !== msg.senderId),
            'chat-group',
            groupChatMsg
        );

        await emitToOnlineUsers(
            socket,
            msg.memberIds.filter((id: string) => id !== msg.senderId),
            'conversationCreated',
            {
                conversationId: newConversation._id,
                conversation: populatedConversation
            }
        );

        await incrementUnreadCounts(
            newConversation._id.toString(),
            msg.memberIds,
            msg.senderId
        );

        return { success: true, conversationId: newConversation._id };
    } catch (error) {
        console.error('Error handling new group conversation:', error);
        socket.emit('error', { message: 'Failed to create group' });
        return { success: false, error: (error as Error).message };
    }
}

// Main socket service
export const socketioService = async (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join conversation room
    socket.on('join-conversation', async (conversationId) => {
        try {
            if (!conversationId) return;
            await joinConversationRoom(socket, conversationId);
            socket.broadcast.to(conversationId).emit("new-member", {
                content: `${socket.user?.name || 'Một người dùng'} đã tham gia cuộc trò chuyện.`
            });
        } catch (error) {
            console.error('Error joining conversation:', error);
        }
    });

    // Handle chat messages
    socket.on('chat', async (msg) => {
        try {
            if (!msg || !msg.senderId || !msg.content) {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            // Check if conversation exists
            const existsConversation = msg.conversationId
                ? await _Conversation.findOne({ _id: msg.conversationId }).lean()
                : null;

            if (existsConversation) {
                await handleExistingConversation(socket, msg, existsConversation);
            } else {
                // New conversation - determine type
                if (msg.type === "user") {
                    await handleNewUserConversation(socket, msg);
                } else if (msg.type === "group") {
                    await handleNewGroupConversation(socket, msg);
                } else {
                    socket.emit('error', { message: 'Invalid conversation type' });
                }
            }
        } catch (error) {
            console.error('Error handling chat:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('typing', async (data) => {
        try {
            if (!data || !data.conversationId) return;

            if (data.type === "user" && data.receiverId) {
                const isOnline = await checkUserOnline(data.receiverId);
                if (isOnline.length > 0) {
                    isOnline.forEach(uid => socket.to(uid).emit('typing', data));
                }
            } else {
                socket.to(data.conversationId).emit('typing', data);
            }
        } catch (error) {
            console.error('Error handling typing:', error);
        }
    });


    socket.on('call-initiate', async (data: {
        callerId: string;
        receiverId: string;
        conversationId: string;
        callType: 'audio' | 'video';
        callerName?: string;
        callerAvatar?: string;
    }) => {
        try {
            const { callerId, receiverId, conversationId, callType, callerName, callerAvatar } = data;

            if (!callerId || !receiverId || !conversationId || !callType) {
                socket.emit('call-error', { message: 'Missing required fields' });
                return;
            }
            console.log("Khoi tao cuoc goi 1")
            const call = await callService.initiateCall(callerId, receiverId, conversationId, callType);

            if (!call) {
                console.log("Khoi tao duowc cuoc goi 2")
                socket.emit('call-error', { message: 'Failed to initiate call' });
            }
            const receiverSocketIds = await checkUserOnline(receiverId);
            if (receiverSocketIds.length > 0) {
                receiverSocketIds.forEach(socketId => {
                    console.log("Gui cho ", socketId)
                    socket.to(socketId).emit('call-incoming', {
                        callId: call?._id,
                        callerId,
                        callerName,
                        callerAvatar,
                        conversationId,
                        callType,
                        timestamp: new Date()
                    });
                });

                console.log("2. Thong bao cho nguoi nhan cuoc goi ", receiverId)


                // Auto-mark as missed after 30 seconds if no answer
                // setTimeout(async () => {
                //     const currentCall = await _Call.findById(call?._id);

                //     console.log('Checking call status for missed call:', currentCall);
                //     console.log('Checking call status for missed call:', currentCall?.status);
                //     if (currentCall && currentCall.status === 'calling') {
                //         await callService.markCallAsMissed(call?._id.toString() || '');

                //         console.log ("call id ", call?._id)
                //         console.log ("call id ", receiverId)
                //         // Notify caller that call was missed
                //         socket.emit('call-missed', {
                //             callId: call?._id,
                //             receiverId
                //         });

                //         // Notify receiver
                //         const receiverSocketsNow = await checkUserOnline(receiverId);
                //         receiverSocketsNow.forEach(socketId => {
                //             socket.to(socketId).emit('call-missed', {
                //                 callId: call?._id,
                //                 callerId
                //             });
                //         });
                //     }
                // }, 30000);
            } else {
                await callService.markCallAsMissed(call?._id.toString() || '');
                socket.emit('call-user-offline', {
                    callId: call?._id,
                    receiverId
                });
            }

            socket.emit('call-initiated', {
                callId: call?._id,
                receiverId,
                conversationId,
                callType
            });

            console.log("3. Gui thong tin de cap nhat cuoc goi ", {
                callId: call?._id,
                receiverId,
                conversationId,
                callType
            })

        } catch (error) {
            console.error('Error initiating call:', error);
            socket.emit('call-error', { message: 'Failed to initiate call' });
        }
    });

    // Send WebRTC offer
    socket.on('call-offer', async (data: {
        callId: string;
        receiverId: string;
        offer: RTCSessionDescriptionInit;
    }) => {
        try {
            const { callId, receiverId, offer } = data;

            if (!callId || !receiverId || !offer) {
                socket.emit('call-error', { message: 'Missing required fields offer' });
                return;
            }

            console.log("gui offer 2 ");
            // Forward offer to receiver
            const receiverSocketIds = await checkUserOnline(receiverId);
            if (receiverSocketIds.length > 0) {
                receiverSocketIds.forEach(socketId => {
                    socket.to(socketId).emit('call-offer', {
                        callId,
                        offer
                    });
                });
            }

        } catch (error) {
            console.error('Error handling call offer:', error);
            socket.emit('call-error', { message: 'Failed to send offer' });
        }
    });

    socket.on('call-answer', async (data: {
        callId: string;
        callerId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        try {
            const { callId, callerId, answer } = data;
            console.log("gui answer 1 ", data);

            if (!callId || !callerId || !answer) {
                socket.emit('call-error', { message: 'Missing required fields aw' });
                return;
            }

            console.log("gui answer 3 ");

            if (socket.user?.id) {
                await callService.acceptCall(callId, socket.user.id);
            }

            const callerSocketIds = await checkUserOnline(callerId);
            if (callerSocketIds.length > 0) {
                callerSocketIds.forEach(socketId => {
                    socket.to(socketId).emit('call-answer', {
                        callId,
                        answer
                    });
                });
            }

        } catch (error) {
            console.error('Error handling call answer:', error);
            socket.emit('call-error', { message: 'Failed to send answer' });
        }
    });

    socket.on('call-ice-candidate', async (data: {
        callId: string;
        targetUserId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        try {
            const { callId, targetUserId, candidate } = data;
            if (!callId || !targetUserId || !candidate) {
                return;
            }
            const targetSocketIds = await checkUserOnline(targetUserId);
            if (targetSocketIds.length > 0) {
                targetSocketIds.forEach(socketId => {
                    socket.to(socketId).emit('call-ice-candidate', {
                        callId,
                        candidate
                    });
                });
            }

        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    });

    // Reject call
    socket.on('call-reject', async (data: {
        callId: string;
        callerId: string;
        reason?: string;
    }) => {
        try {
            const { callId, callerId, reason } = data;

            if (!callId || !callerId) {
                socket.emit('call-error', { message: 'Missing required fields rj' });
                return;
            }

            // Update call status
            if (socket.user?.id) {
                await callService.rejectCall(callId, socket.user.id);
            }

            const callerSocketIds = await checkUserOnline(callerId);
            if (callerSocketIds.length > 0) {
                callerSocketIds.forEach(socketId => {
                    socket.to(socketId).emit('call-rejected', {
                        callId,
                        reason: reason || 'Call rejected'
                    });
                });
            }

        } catch (error) {
            console.error('Error rejecting call:', error);
            socket.emit('call-error', { message: 'Failed to reject call' });
        }
    });

    socket.on('call-end', async (data: {
        callId: string;
        otherUserId: string;
    }) => {
        try {
            const { callId, otherUserId } = data;
            if (!callId || !otherUserId) {
                socket.emit('call-error', { message: 'Missing required fields end' });
                return;
            }

            console.log("ket thuc cuoc goi 6 ");

            if (socket.user?.id) {
                await callService.endCall(callId, socket.user.id);
            }

            const otherUserSocketIds = await checkUserOnline(otherUserId);
            if (otherUserSocketIds.length > 0) {
                otherUserSocketIds.forEach(socketId => {
                    socket.to(socketId).emit('call-ended', {
                        callId
                    });
                });
            }

        } catch (error) {
            console.error('Error ending call:', error);
            socket.emit('call-error', { message: 'Failed to end call' });
        }
    });

    socket.on('call-status-update', async (data: {
        callId: string;
        status: string;
    }) => {
        try {
            console.log(`Call ${data.callId} status: ${data.status}`);
        } catch (error) {
            console.error('Error handling call status update:', error);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        try {
            if (socket.user?.id) {
                await redisClient.sRem(`${KEY_USER_ONLINE_SOCKET}${socket.user.id}`, socket.id);
            }
            const keys = await redisClient.keys(`${KEY_GROUP_PREFIX}*`);
            const pipeline = redisClient.multi();
            keys.forEach(key => {
                pipeline.sRem(key, socket.id);
            });
            await pipeline.exec();
        } catch (error) {
            console.error('Error cleaning up socket:', error);
        }
    });
};
