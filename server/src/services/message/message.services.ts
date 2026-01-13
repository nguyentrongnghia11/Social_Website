import _Conversation from '../../models/conversation';
import _Message, { IMediaFile } from '../../models/message';
import _Call from '../../models/call';
import _Media from '../../models/media';
import { Types } from 'mongoose';
import { ErrorApi } from '../../middleware/error';
import redisClient from '../../databases/connectRedis';
import cloudinary from '../../databases/cloud';
import { uploadProducer } from '../queue/uploadProducer.services';

export class MessageService {
    async getAllConversationsOfUser(userId: string) {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new ErrorApi(400, "Invalid user ID");
        }
        const userIdObj = new Types.ObjectId(userId);

        const listConversation = await _Conversation.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userIdObj, type: "user" },
                        { receiverId: userIdObj, type: "user" },
                        { type: "group" }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'groupId',
                    foreignField: '_id',
                    as: 'groupInfo'
                }
            },
            {
                $unwind: {
                    path: '$groupInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        { type: "user" },
                        {
                            type: "group",
                            'groupInfo.members': userIdObj
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $unwind: {
                    path: '$senderInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiverId',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            {
                $unwind: {
                    path: '$receiverInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { conversationId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$conversationId', '$$conversationId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'senderId',
                                foreignField: '_id',
                                as: 'sender'
                            }
                        },
                        {
                            $unwind: {
                                path: '$sender',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                content: 1,
                                contentType: 1,
                                createdAt: 1,
                                senderId: 1,
                                senderName: '$sender.name'
                            }
                        }
                    ],
                    as: 'lastMessage'
                }
            },
            {
                $unwind: {
                    path: '$lastMessage',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    let: { conversationId: '$_id', userId: userIdObj },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$conversationId', '$$conversationId'] },
                                        { $ne: ['$senderId', '$$userId'] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadCount'
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    groupId: {
                        $cond: {
                            if: { $eq: ['$type', 'group'] },
                            then: {
                                _id: '$groupInfo._id',
                                name: '$groupInfo.name',
                                members: '$groupInfo.members'
                            },
                            else: null
                        }
                    },
                    senderId: {
                        $cond: {
                            if: { $eq: ['$type', 'user'] },
                            then: {
                                _id: '$senderInfo._id',
                                name: '$senderInfo.name',
                                email: '$senderInfo.email',
                                avatar: '$senderInfo.avatar'
                            },
                            else: null
                        }
                    },
                    receiverId: {
                        $cond: {
                            if: { $eq: ['$type', 'user'] },
                            then: {
                                _id: '$receiverInfo._id',
                                name: '$receiverInfo.name',
                                email: '$receiverInfo.email',
                                avatar: '$receiverInfo.avatar'
                            },
                            else: null
                        }
                    },
                    lastMessage: {
                        $cond: {
                            if: { $ne: ['$lastMessage', null] },
                            then: {
                                content: '$lastMessage.content',
                                contentType: '$lastMessage.contentType',
                                createdAt: '$lastMessage.createdAt',
                                senderId: '$lastMessage.senderId',
                                senderName: '$lastMessage.senderName'
                            },
                            else: null
                        }
                    },
                    unreadCount: {
                        $ifNull: [
                            { $arrayElemAt: ['$unreadCount.count', 0] },
                            0
                        ]
                    }
                }
            },
            {
                $sort: {
                    'lastMessage.createdAt': -1,
                    updatedAt: -1
                }
            }
        ]);

        // Get total unread count from Redis cache
        let totalUnreadCount = 0;
        const cachedCount = await redisClient.get(`unread-count:${userId}`);

        if (cachedCount !== null) {
            totalUnreadCount = parseInt(cachedCount);
        } else {
            // Fallback to calculate from conversations if cache miss
            totalUnreadCount = listConversation.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
            // Store in cache for next time
            await redisClient.set(`unread-count:${userId}`, totalUnreadCount.toString());
        }

        return {
            conversations: listConversation,
            totalUnreadCount
        };
    }

    async markMessagesAsRead(conversationId: string, userId: string) {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
            throw new ErrorApi(400, "Invalid conversation ID");
        }


        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new ErrorApi(400, "Invalid user ID");
        }
        const userIdObj = new Types.ObjectId(userId);
        const conversationIdObj = new Types.ObjectId(conversationId);
        const unreadCount = await _Message.countDocuments({
            conversationId: conversationIdObj,
            senderId: { $ne: userIdObj },
            isRead: false
        });

        await _Message.updateMany(
            {
                conversationId: conversationIdObj,
                senderId: { $ne: userIdObj },
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        if (unreadCount > 0) {
            const currentCount = await redisClient.get(`unread-count:${userId}`);
            if (currentCount !== null) {
                const newCount = Math.max(0, parseInt(currentCount) - unreadCount);
                await redisClient.set(`unread-count:${userId}`, newCount.toString());
            }
        }

        return { markedCount: unreadCount };
    }

    async getMessagesOfConversation(conversationId: string, page: number = 1, limit: number = 50) {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
            throw new ErrorApi(400, "Invalid conversation ID");
        }
        const conversation = await _Conversation.findById(conversationId);

        if (!conversation) {
            throw new ErrorApi(404, "Conversation not found");
        }

        const messages = await _Message.find({ conversationId })
            .populate({
                path: 'senderId',
                select: '_id name avatar email'
            })
            .lean();

        const calls = await _Call.find({ conversationId })
            .populate({
                path: 'callerId',
                select: '_id name avatar'
            })
            .populate({
                path: 'receiverId',
                select: '_id name avatar'
            })
            .lean();

        const transformedCalls = calls.map(call => ({
            ...call,
            itemType: 'call' as const,
            senderId: call.callerId,
            contentType: 'call' as const,
            createdAt: call.createdAt
        }));

        const transformedMessages = messages.map(msg => ({
            ...msg,
            itemType: 'message' as const,
            createdAt: msg.createdAt
        }));
        const allItems = [...transformedMessages, ...transformedCalls].sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const skip = (page - 1) * limit;
        const paginatedItems = allItems.slice(skip, skip + limit);
        
        paginatedItems.reverse();
        
        return {
            messages: paginatedItems,
            total: allItems.length
        };
    }

    async sendMessageWithMedia(
        conversationId: string, 
        senderId: string, 
        content: string, 
        files: Express.Multer.File[],
        type: 'user' | 'group'
    ) {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
            throw new ErrorApi(400, "Invalid conversation ID");
        }

        if (!senderId || !Types.ObjectId.isValid(senderId)) {
            throw new ErrorApi(400, "Invalid sender ID");
        }

        const conversation = await _Conversation.findById(conversationId);
        if (!conversation) {
            throw new ErrorApi(404, "Conversation not found");
        }

        // Upload files to cloudinary
        const mediaFiles: IMediaFile[] = [];
        
        if (files && files.length > 0) {
            for (const file of files) {
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    folder: `messages/${conversationId}`,
                    resource_type: 'auto'
                });

                const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                
                mediaFiles.push({
                    url: uploadResult.secure_url,
                    type: fileType,
                    size: file.size,
                    filename: file.originalname,
                    cloudinaryId: uploadResult.public_id
                });

                // Save to Media model
                await _Media.create({
                    url: uploadResult.secure_url,
                    type: fileType,
                    size: file.size,
                    uploadedBy: new Types.ObjectId(senderId),
                    cloudinaryId: uploadResult.public_id
                });
            }
        }

        // Determine content type
        let contentType: 'text' | 'image' | 'video' | 'file' = 'text';
        if (mediaFiles.length > 0) {
            const hasVideo = mediaFiles.some(f => f.type === 'video');
            contentType = hasVideo ? 'video' : 'image';
        }

        const message = await _Message.create({
            conversationId: new Types.ObjectId(conversationId),
            senderId: new Types.ObjectId(senderId),
            content: content || (mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType,
            mediaFiles,
            type,
            isRead: false
        });

        await _Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date()
        });

        const populatedMessage = await _Message.findById(message._id)
            .populate('senderId', '_id name avatar email')
            .lean();

        return populatedMessage;
    }

    async grantPermissionUploadMedia(
        conversationId: string,
        userId: string,
        fileCount: number,
        fileType: 'image' | 'video'
    ) {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
            throw new ErrorApi(400, "Invalid conversation ID");
        }

        const conversation = await _Conversation.findById(conversationId);
        if (!conversation) {
            throw new ErrorApi(404, "Conversation not found");
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'messages';

        const signature = await cloudinary.utils.api_sign_request(
            { timestamp, folder },
            cloudinary.config().api_secret
        );

        if (!signature) {
            throw new ErrorApi(500, "Failed to generate signature");
        }

        return {
            signature,
            timestamp,
            folder,
            cloudName: cloudinary.config().cloud_name,
            apiKey: cloudinary.config().api_key,
            fileCount,
            fileType
        };
    }

    async saveMessageMedia(messageId: string, mediaFiles: IMediaFile[]) {
        if (!messageId || !Types.ObjectId.isValid(messageId)) {
            throw new ErrorApi(400, "Invalid message ID");
        }

        const message = await _Message.findById(messageId);
        if (!message) {
            throw new ErrorApi(404, "Message not found");
        }

        // Update message with media files
        message.mediaFiles = mediaFiles;
        
        // Update content type based on media
        if (mediaFiles.length > 0) {
            const hasVideo = mediaFiles.some(f => f.type === 'video');
            message.contentType = hasVideo ? 'video' : 'image';
        }

        await message.save();

        // Save to Media model
        for (const file of mediaFiles) {
            await _Media.create({
                url: file.url,
                type: file.type,
                size: file.size,
                uploadedBy: message.senderId,
                cloudinaryId: file.cloudinaryId
            });
        }

        return message;
    }
}

export default new MessageService();
