import _Conversation from '../models/conversation';
import _Message from '../models/message';
import _User from '../models/user';
import redisClient from '../databases/connectRedis';
import { Socket } from 'socket.io';
import _Notifycation from '../models/notification';
import _Group from '../models/group';
import _Call from '../models/call';
import _File from '../models/file';
import groupService from "../services/group/group.services";
import callService from "./call/call.services";
import { sendMessageNotificationWhenOffline, sendGroupMessageNotificationWhenOffline } from './notification/notification.services';
import { Types } from 'mongoose';

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
    const recipientIds = memberIds.filter(memberId => memberId !== senderId);

    // Increment Redis counters for per-conversation unread counts
    recipientIds.forEach(memberId => {
        pipeline.incr(`${KEY_UNREAD_COUNT}${memberId}:${conversationId}`);
    });
    await pipeline.exec();

    await Promise.all(recipientIds.map(async (memberId) => {
        await _User.findByIdAndUpdate(memberId, { $inc: { totalUnreadCount: 1 } });
        await redisClient.incr(`unread-count:${memberId}`);
    }));
}

const handleExistingConversation = async (socket: Socket, msg: any, conversation: any) => {
    try {

        let contentType = 'text';
        if (msg.mediaFiles && msg.mediaFiles.length > 0) {
            const firstMedia = msg.mediaFiles[0];
            if (firstMedia.resourceType === 'video') {
                contentType = 'video';
            } else if (firstMedia.resourceType === 'image') {
                contentType = 'image';
            } else if (firstMedia.resourceType === 'raw') {
                contentType = 'file';
            }
        }

        const message = await _Message.create({
            conversationId: conversation._id,
            senderId: msg.senderId,
            // Nhúng senderInfo — tránh $lookup khi getMessagesOfConversation
            senderInfo: msg.senderInfo || (msg.nameSender ? { _id: msg.senderId, name: msg.nameSender } : undefined),
            content: msg.content || (msg.mediaFiles && msg.mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
            type: conversation.type
        });
        if (!message) {
            throw new Error('Failed to create message');
        }

        if (msg.mediaFiles && msg.mediaFiles.length > 0) {
            const fileDocs = msg.mediaFiles.map((file: any) => ({
                secure_url: file.url,
                bytes: file.size || file.fileSize || 0,
                public_id: file.publicId || file.fileName || file.filename || `message-${Date.now()}`,
                folder: `messages/${conversation._id.toString()}`,
                resource_type: file.resourceType || file.type || 'image',
                messageId: message._id,
                conversationId: conversation._id,
                uploadedBy: new Types.ObjectId(msg.senderId)
            }));

            await _File.insertMany(fileDocs);
        }

        await _Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: {
                text: message.content,
                senderName: msg.nameSender || 'Unknown',
                createdAt: message.createdAt,
                messageId: message._id
            },
            updatedAt: new Date()
        });

        const messageData = {
            msg: {
                ...msg,
                name: msg.nameSender || 'Unknown',
                conversationId: conversation._id.toString(),
                senderName: msg.nameSender,
                senderId: {
                    _id: msg.senderId,
                    name: msg.nameSender || 'Unknown'
                },
                contentType: contentType,
                mediaFiles: msg.mediaFiles || []
            }
        };

        socket.to(conversation._id.toString()).emit("chat", messageData);

        // Send push notification to offline users
        let memberIds: string[] = [];
        if (conversation.type === 'group') {
            const memberSnapshots = conversation.participants || [];
            if (memberSnapshots.length > 0) {
                memberIds = memberSnapshots
                    .map((m: any) => m._id?.toString())
                    .filter(Boolean)
                    .filter((id: string) => id !== msg.senderId);
            } else if (conversation.groupInfo?.groupId) {
                const group = await _Group.findById(conversation.groupInfo.groupId).select('members name').lean();
                memberIds = (group?.members || []).map((id: any) => id.toString()).filter((id: string) => id !== msg.senderId);
            }

            // Send group notification to offline members
            const onlineMemberIds = await Promise.all(memberIds.map(id => checkUserOnline(id)));
            const offlineMemberIds = memberIds.filter((id, idx) => onlineMemberIds[idx].length === 0);

            if (offlineMemberIds.length > 0) {
                const groupName = conversation.groupInfo?.name || 'Group';
                await sendGroupMessageNotificationWhenOffline(
                    offlineMemberIds,
                    msg.nameSender || 'Unknown',
                    msg.content || 'Đã gửi tệp đính kèm',
                    groupName,
                    conversation._id.toString()
                );
            }
        } else {
            // Dùng participantIds (model mới) — luôn có sẵn
            if (Array.isArray(conversation.participantIds) && conversation.participantIds.length > 0) {
                memberIds = conversation.participantIds
                    .map((id: any) => id?.toString())
                    .filter(Boolean)
                    .filter((id: string) => id !== msg.senderId);
            } else if (Array.isArray(conversation.participants) && conversation.participants.length > 0) {
                // Fallback: lấy từ participants snapshot
                memberIds = conversation.participants
                    .map((p: any) => p._id?.toString())
                    .filter(Boolean)
                    .filter((id: string) => id !== msg.senderId);
            }

            const recipientId = memberIds[0];
            if (recipientId) {
                const isOnline = await checkUserOnline(recipientId);
                console.log("isOnline ", isOnline)
                if (isOnline.length === 0) {
                    await sendMessageNotificationWhenOffline(
                        recipientId,
                        msg.nameSender || 'Unknown',
                        msg.content || 'Đã gửi tệp đính kèm',
                        conversation._id.toString()
                    );
                }
            }
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
        const senderIdObj = new Types.ObjectId(msg.senderId);
        const receiverIdObj = new Types.ObjectId(msg.receiverId);
        const existing = await _Conversation.findOne({
            type: 'user',
            $or: [
                { participantIds: { $all: [senderIdObj, receiverIdObj] } },
                { senderId: msg.senderId, receiverId: msg.receiverId },
                { senderId: msg.receiverId, receiverId: msg.senderId }
            ]
        }).lean();

        if (existing) {
            socket.emit('conversationCreated', {
                conversationId: existing._id,
                conversation: {
                    ...existing,
                    participants: existing.participants?.length ? existing.participants : [],
                    participantIds: existing.participantIds?.length ? existing.participantIds : [senderIdObj, receiverIdObj]
                }
            });
            return await handleExistingConversation(socket, { ...msg, conversationId: existing._id }, existing);
        }

        const [senderUser, receiverUser] = await Promise.all([
            _User.findById(msg.senderId).select('name email avt_url').lean(),
            _User.findById(msg.receiverId).select('name email avt_url').lean()
        ]);

        const senderInfo = senderUser ? {
            _id: senderUser._id,
            name: senderUser.name,
            email: senderUser.email,
            avt_url: senderUser.avt_url
        } : undefined;

        const receiverInfo = receiverUser ? {
            _id: receiverUser._id,
            name: receiverUser.name,
            email: receiverUser.email,
            avt_url: receiverUser.avt_url
        } : undefined;

        // Create new
        const nConversation = await new _Conversation({
            type: "user",
            participantIds: [senderIdObj, receiverIdObj],
            participants: [senderInfo, receiverInfo].filter(Boolean)
        }).save();

        let contentType = 'text';
        if (msg.mediaFiles && msg.mediaFiles.length > 0) {
            const firstMedia = msg.mediaFiles[0];
            if (firstMedia.resourceType === 'video') {
                contentType = 'video';
            } else if (firstMedia.resourceType === 'image') {
                contentType = 'image';
            } else if (firstMedia.resourceType === 'raw') {
                contentType = 'file';
            }
        }

        const newConversationId = (nConversation as any)._id as Types.ObjectId;

        const message = await _Message.create({
            conversationId: newConversationId,
            senderId: msg.senderId,
            // Nhúng senderInfo — tránh $lookup khi getMessagesOfConversation
            senderInfo: msg.senderInfo || (msg.nameSender ? { _id: msg.senderId, name: msg.nameSender } : undefined),
            content: msg.content || (msg.mediaFiles && msg.mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
            type: 'user'
        });

        if (msg.mediaFiles && msg.mediaFiles.length > 0) {
            const fileDocs = msg.mediaFiles.map((file: any) => ({
                secure_url: file.url,
                bytes: file.size || file.fileSize || 0,
                public_id: file.publicId || file.fileName || file.filename || `message-${Date.now()}`,
                folder: `messages/${newConversationId.toString()}`,
                resource_type: file.resourceType || file.type || 'image',
                messageId: message._id,
                conversationId: newConversationId,
                uploadedBy: new Types.ObjectId(msg.senderId)
            }));

            await _File.insertMany(fileDocs);
        }

        await _Conversation.findByIdAndUpdate(newConversationId, {
            lastMessage: {
                text: message.content,
                senderName: msg.nameSender || 'Unknown',
                createdAt: message.createdAt,
                messageId: message._id
            },
            updatedAt: new Date()
        });

        await joinConversationRoom(socket, newConversationId.toString());

        // Notify sender
        socket.emit('conversationCreated', {
            conversationId: newConversationId,
            conversation: nConversation.toObject()
        });

        // Notify receiver
        const receiverSocketIds = await checkUserOnline(msg.receiverId);
        if (receiverSocketIds.length > 0) {
            const messageData = {
                msg: {
                    ...msg,
                    name: msg.nameSender || 'Unknown',
                    conversationId: newConversationId.toString(),
                    senderName: msg.nameSender,
                    senderId: {
                        _id: msg.senderId,
                        name: msg.nameSender || 'Unknown'
                    },
                    contentType: contentType,
                    mediaFiles: msg.mediaFiles || []
                }
            };
            receiverSocketIds.forEach(socketId => {
                socket.to(socketId).emit('chat', messageData);
                socket.to(socketId).emit('conversationCreated', {
                    conversationId: newConversationId,
                    conversation: nConversation.toObject()
                });
            });
        } else {
            await sendMessageNotificationWhenOffline(
                msg.receiverId,
                msg.nameSender || 'Unknown',
                msg.content || 'Đã gửi tệp đính kèm',
                newConversationId.toString()
            );
        }

        await redisClient.incr(`${KEY_UNREAD_COUNT}${msg.receiverId}:${newConversationId}`);

        return { success: true, conversationId: newConversationId };
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

        const populatedConversation = {
            ...newConversation,
            groupInfo: newConversation.groupInfo || {
                groupId: newGroup._id,
                name: newGroup.name
            },
            participantIds: newConversation.participantIds || msg.memberIds,
            participants: newConversation.participants || []
        };

        // Determine contentType based on mediaFiles
        let contentType = 'text';
        if (msg.mediaFiles && msg.mediaFiles.length > 0) {
            const firstMedia = msg.mediaFiles[0];
            if (firstMedia.resourceType === 'video') {
                contentType = 'video';
            } else if (firstMedia.resourceType === 'image') {
                contentType = 'image';
            } else if (firstMedia.resourceType === 'raw') {
                contentType = 'file';
            }
        }

        const firstMessage = await _Message.create({
            conversationId: newConversation._id,
            senderId: msg.senderId,
            // Nhúng senderInfo — tránh $lookup khi getMessagesOfConversation
            senderInfo: msg.senderInfo || (msg.nameSender ? { _id: msg.senderId, name: msg.nameSender } : undefined),
            content: msg.content || `Đã tạo nhóm "${msg.groupName}"`,
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
            type: 'group'
        });

        await _Conversation.findByIdAndUpdate(newConversation._id, {
            lastMessage: {
                text: firstMessage.content,
                senderName: msg.nameSender || 'Unknown',
                createdAt: firstMessage.createdAt,
                messageId: firstMessage._id
            },
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
                senderId: {
                    _id: msg.senderId,
                    name: msg.nameSender || 'Unknown'
                },
                nameSender: msg.nameSender || 'Unknown',
                senderName: msg.nameSender || 'Unknown',
                content: msg.content || `Đã tạo nhóm "${msg.groupName}"`,
                conversationId: newConversation._id.toString(),
                groupId: (newGroup._id as any).toString(),
                contentType: contentType,
                mediaFiles: msg.mediaFiles || []
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

        // Send push notification to offline members
        const offlineMembers = msg.memberIds.filter((id: string) => id !== msg.senderId);
        const onlineStatusChecks = await Promise.all(
            offlineMembers.map((id: string) => checkUserOnline(id))
        );
        const offlineMemberIds = offlineMembers.filter(
            (_: string, idx: number) => onlineStatusChecks[idx].length === 0
        );

        if (offlineMemberIds.length > 0) {
            await sendGroupMessageNotificationWhenOffline(
                offlineMemberIds,
                msg.nameSender || 'Unknown',
                msg.content || `Đã tạo nhóm "${msg.groupName}"`,
                msg.groupName,
                newConversation._id.toString()
            );
        }

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

    socket.on('chat', async (msg) => {
        try {


            if (!msg || !msg.senderId) {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            if (!msg.content && (!msg.mediaFiles || msg.mediaFiles.length === 0)) {
                socket.emit('error', { message: 'Message must have content or media files' });
                return;
            }

            // Check if conversation exists
            const existsConversation = msg.conversationId
                ? await _Conversation.findOne({ _id: msg.conversationId }).lean()
                : null;

            if (existsConversation) {
                await handleExistingConversation(socket, msg, existsConversation);
            } else {
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

            console.log('[Call-Initiate] Received data:', {
                callerId,
                receiverId,
                conversationId,
                callType,
                callerName,
                callerAvatar
            });

            // Validate required fields
            if (!callerId || !receiverId || !conversationId || !callType) {
                console.error('[Call-Initiate] Missing required fields:', { callerId, receiverId, conversationId, callType });
                socket.emit('call-error', { message: 'Missing required fields' });
                return;
            }

            const call = await callService.initiateCall(callerId, receiverId, conversationId, callType);

            if (!call) {
                console.error('[Call-Initiate] Failed to create call in database');
                socket.emit('call-error', { message: 'Failed to initiate call' });
                return;
            }

            const callId = call._id.toString();
            console.log('[Call-Initiate] Call created successfully:', callId);

            // Check if receiver is online
            const receiverSocketIds = await checkUserOnline(receiverId);

            if (receiverSocketIds.length > 0) {
                // Send call notification to all receiver's devices
                receiverSocketIds.forEach(socketId => {
                    console.log('[Call-Initiate] Sending to receiver socket:', socketId);
                    socket.to(socketId).emit('call-incoming', {
                        callId,
                        callerId,
                        callerName,
                        callerAvatar,
                        conversationId,
                        callType,
                        timestamp: new Date()
                    });
                });

                // Auto-mark as missed after 45 seconds if no answer
                const missedCallTimeout = setTimeout(async () => {
                    try {
                        const currentCall = await callService.getCallById(callId);
                        console.log('[Timeout] Checking call status:', currentCall?.status);

                        if (currentCall && currentCall.status === 'calling') {
                            console.log('📥 [Timeout] Marking call as missed:', callId);
                            await callService.markCallAsMissed(callId);

                            // Notify caller
                            socket.emit('call-missed', {
                                callId,
                                receiverId
                            });

                            // Notify receiver
                            const receiverSocketsNow = await checkUserOnline(receiverId);
                            receiverSocketsNow.forEach(socketId => {
                                socket.to(socketId).emit('call-missed', {
                                    callId,
                                    callerId
                                });
                            });
                        }
                    } catch (error) {
                        console.error('Error in missed call timeout:', error);
                    }
                }, 45000); // 45 seconds

                // Store timeout to clear it if call is answered
                socket.data.callTimeout = missedCallTimeout;

            } else {
                await callService.markCallAsMissed(callId);
                socket.emit('call-user-offline', {
                    callId,
                    receiverId
                });
            }

            socket.emit('call-initiated', {
                callId,
                receiverId,
                conversationId,
                callType
            });

            console.log('Call-Initiate Complete');

        } catch (error: any) {
            console.error('❌ [Call-Initiate] Error initiating call:', {
                error: error.message,
                stack: error.stack,
                data: {
                    callerId: data.callerId,
                    receiverId: data.receiverId,
                    conversationId: data.conversationId,
                    callType: data.callType
                }
            });

            const errorMessage = error.message || 'Failed to initiate call';
            socket.emit('call-error', {
                message: `Failed to initiate call: ${errorMessage}`
            });
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
            console.log('[Call-Answer] Received answer for call:', callId);

            if (!callId || !callerId || !answer) {
                console.error('Missing required fields for call-answer');
                socket.emit('call-error', { message: 'Missing required fields' });
                return;
            }

            // Clear missed call timeout since call is being answered
            if (socket.data.callTimeout) {
                clearTimeout(socket.data.callTimeout);
                socket.data.callTimeout = null;
                console.log('Cleared missed call timeout');
            }

            // Update call status to accepted
            if (socket.user?.id) {
                await callService.acceptCall(callId, socket.user.id);
                console.log('Call accepted in database');
            }

            // Forward answer to caller
            const callerSocketIds = await checkUserOnline(callerId);
            if (callerSocketIds.length > 0) {
                callerSocketIds.forEach(socketId => {
                    console.log('[Call-Answer] Sending to caller socket:', socketId);
                    socket.to(socketId).emit('call-answer', {
                        callId,
                        answer
                    });
                });
            } else {
                console.warn('Caller no longer online');
                socket.emit('call-error', { message: 'Caller no longer online' });
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
                console.log('[Call-ICE-Candidate] Forwarded ICE candidate to:', targetUserId);
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
            console.log('[Call-Reject] Call rejected:', callId);

            if (!callId || !callerId) {
                console.error('Missing required fields for call-reject');
                socket.emit('call-error', { message: 'Missing required fields' });
                return;
            }

            // Clear missed call timeout
            if (socket.data.callTimeout) {
                clearTimeout(socket.data.callTimeout);
                socket.data.callTimeout = null;
                console.log('leared missed call timeout');
            }

            // Update call status
            if (socket.user?.id) {
                await callService.rejectCall(callId, socket.user.id);
            }

            // Notify caller
            const callerSocketIds = await checkUserOnline(callerId);
            if (callerSocketIds.length > 0) {
                callerSocketIds.forEach(socketId => {
                    console.log(' [Call-Reject] Notifying caller socket:', socketId);
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
