import _Conversation from '../models/conversation';
import _Message from '../models/message';
import redisClient from '../databases/connectRedis';
import { Socket } from 'socket.io';
import _Notifycation from '../models/notification';
import _Group from '../models/group';
import _Call from '../models/call';
import groupService from "../services/group/group.services";
import callService from "./call/call.services";
import { sendMessageNotification, sendGroupMessageNotification } from './notification/notification.services';
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
    memberIds.forEach(memberId => {
        if (memberId !== senderId) {
            pipeline.incr(`${KEY_UNREAD_COUNT}${memberId}:${conversationId}`);
        }
    });
    await pipeline.exec();
}

const handleExistingConversation = async (socket: Socket, msg: any, conversation: any) => {
    try {
        console.log('💾 [handleExistingConversation] Received msg:', { 
            content: msg.content, 
            mediaFiles: msg.mediaFiles,
            mediaFilesCount: msg.mediaFiles?.length 
        });

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

        const message = await _Message.create({
            conversationId: conversation._id,
            senderId: msg.senderId,
            content: msg.content || (msg.mediaFiles && msg.mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
            type: conversation.type
        });

        console.log('✅ [handleExistingConversation] Message created:', {
            _id: message._id,
            contentType: message.contentType,
            mediaFilesCount: message.mediaFiles?.length
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
                senderName: msg.nameSender,
                senderId: {
                    _id: msg.senderId,
                    name: msg.nameSender || 'Unknown'
                },
                contentType: contentType,
                mediaFiles: msg.mediaFiles || []
            }
        };

        console.log('📡 [handleExistingConversation] Emitting chat event with mediaFiles:', messageData.msg.mediaFiles?.length);
        socket.to(conversation._id.toString()).emit("chat", messageData);

        // Send push notification to offline users
        let memberIds: string[] = [];
        if (conversation.type === 'group' && conversation.groupId) {
            const group = await _Group.findById(conversation.groupId).select('members name').lean();
            memberIds = (group?.members || []).map((id: any) => id.toString()).filter((id: string) => id !== msg.senderId);
            
            // Send group notification to offline members
            const onlineMemberIds = await Promise.all(memberIds.map(id => checkUserOnline(id)));
            const offlineMemberIds = memberIds.filter((id, idx) => onlineMemberIds[idx].length === 0);
            
            if (offlineMemberIds.length > 0 && group) {
                await sendGroupMessageNotification(
                    offlineMemberIds,
                    msg.nameSender || 'Unknown',
                    msg.content || 'Đã gửi tệp đính kèm',
                    group.name || 'Group',
                    conversation._id.toString()
                );
            }
        } else {
            memberIds = [
                conversation.senderId?.toString(),
                conversation.receiverId?.toString()
            ].filter(Boolean).filter((id: string) => id !== msg.senderId);
            
            // Send notification to offline recipient
            const recipientId = memberIds[0];
            if (recipientId) {
                const isOnline = await checkUserOnline(recipientId);
                if (isOnline.length === 0) {
                    await sendMessageNotification(
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

        const message = await _Message.create({
            conversationId: nConversation._id,
            senderId: msg.senderId,
            content: msg.content || (msg.mediaFiles && msg.mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
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
                    conversationId: nConversation._id,
                    conversation: populatedConversation
                });
            });
        } else {
            // Receiver is offline, send push notification
            await sendMessageNotification(
                msg.receiverId,
                msg.nameSender || 'Unknown',
                msg.content || 'Đã gửi tệp đính kèm',
                (nConversation._id as any).toString()
            );
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
            content: msg.content || `Đã tạo nhóm "${msg.groupName}"`,
            contentType: contentType,
            mediaFiles: msg.mediaFiles || [],
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
            await sendGroupMessageNotification(
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
            console.log('📨 [Socket.chat] Received message:', {
                senderId: msg.senderId,
                content: msg.content?.substring(0, 50),
                mediaFiles: msg.mediaFiles,
                mediaFilesCount: msg.mediaFiles?.length,
                type: msg.type,
                conversationId: msg.conversationId
            });

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

            // Validate callType
            if (!['audio', 'video'].includes(callType)) {
                console.error('[Call-Initiate] Invalid call type:', callType);
                socket.emit('call-error', { message: 'Invalid call type' });
                return;
            }

            // Validate ObjectIds
            if (!Types.ObjectId.isValid(callerId)) {
                console.error('[Call-Initiate] Invalid callerId:', callerId);
                socket.emit('call-error', { message: 'Invalid caller ID' });
                return;
            }
            if (!Types.ObjectId.isValid(receiverId)) {
                console.error('[Call-Initiate] Invalid receiverId:', receiverId);
                socket.emit('call-error', { message: 'Invalid receiver ID' });
                return;
            }
            if (!Types.ObjectId.isValid(conversationId)) {
                console.error('[Call-Initiate] Invalid conversationId:', conversationId);
                socket.emit('call-error', { message: 'Invalid conversation ID' });
                return;
            }

            console.log('[Call-Initiate] Starting call with validated IDs');
            
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

            console.log('✅ [Call-Initiate] Complete');

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
                console.log ('[Call-ICE-Candidate] Forwarded ICE candidate to:', targetUserId);
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
