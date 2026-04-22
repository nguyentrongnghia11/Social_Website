import _Conversation from '../../models/conversation';
import _Message, { IMediaFile } from '../../models/message';
import _Call from '../../models/call';
import _User from '../../models/user';
import _File from '../../models/file';
import { Types } from 'mongoose';
import { ErrorApi } from '../../middleware/error';
import redisClient from '../../databases/connectRedis';
import { S3Service } from '../storage/s3.service';
import { BUCKET_NAME } from '../../databases/s3';
import { uploadProducer } from '../queue/uploadProducer.services';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class MessageService {
    async getAllConversationsOfUser(userId: string) {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new ErrorApi(400, "Invalid user ID");
        }
        const userIdObj = new Types.ObjectId(userId);

        const listConversation = await _Conversation.aggregate([
            {
                $match: {
                    participantIds: userIdObj
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
                    participantIds: 1,
                    participants: 1,
                    groupInfo: 1,
                    lastMessage: 1,
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


        return {
            conversations: listConversation
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
            await _User.findByIdAndUpdate(userId, {
                $inc: { totalUnreadCount: -unreadCount }
            });

            const currentCount = await redisClient.get(`unread-count:${userId}`);
            if (currentCount !== null) {
                const newCount = Math.max(0, parseInt(currentCount) - unreadCount);
                await redisClient.set(`unread-count:${userId}`, newCount.toString());
            }
        }

        return { markedCount: unreadCount };
    }

    async getTotalUnreadCount(userId: string) {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new ErrorApi(400, "Invalid user ID");
        }

        const cachedCount = await redisClient.get(`unread-count:${userId}`);
        if (cachedCount !== null) {
            console.log("Cache hit for unread count:", cachedCount);
            return { totalUnreadCount: parseInt(cachedCount) };
        }

        const user = await _User.findById(userId).select('totalUnreadCount').lean();
        console.log("User totalUnreadCount from DB:", user?.totalUnreadCount);
        if (user && typeof user.totalUnreadCount === 'number') {
            await redisClient.set(`unread-count:${userId}`, user.totalUnreadCount.toString());
            return { totalUnreadCount: user.totalUnreadCount };
        }
        // recovery

        const userIdObj = new Types.ObjectId(userId);
        const totalUnreadCount = await _Message.countDocuments({
            conversationId: {
                $in: await _Conversation.find({ participantIds: userIdObj }).distinct('_id')
            },
            senderId: { $ne: userIdObj },
            isRead: false
        });
        await _User.findByIdAndUpdate(userId, { totalUnreadCount });
        await redisClient.set(`unread-count:${userId}`, totalUnreadCount.toString());

        return { totalUnreadCount };
    }

    async getMessagesOfConversation(conversationId: string, page: number = 1, limit: number = 50) {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
            throw new ErrorApi(400, "Invalid conversation ID");
        }
        const conversation = await _Conversation.findById(conversationId);

        if (!conversation) {
            throw new ErrorApi(404, "Conversation not found");
        }

        // senderInfo đã embedded — không cần .populate('senderId') nữa
        const messages = await _Message.find({ conversationId })
            .select('-__v')
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

        // Upload files to S3
        const mediaFiles: IMediaFile[] = [];

        if (files && files.length > 0) {
            for (const file of files) {
                // Read file buffer
                const fileBuffer = fs.readFileSync(file.path);
                const ext = path.extname(file.originalname);
                const fileName = `${uuidv4()}${ext}`;

                // Determine content type
                const contentType = file.mimetype || 'application/octet-stream';

                // Upload to S3
                const uploadResult = await S3Service.uploadFile(
                    fileBuffer,
                    fileName,
                    contentType,
                    `messages/${conversationId}`
                );

                const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';

                mediaFiles.push({
                    url: uploadResult.url,
                    type: fileType,
                    resourceType: fileType,
                    size: file.size,
                    filename: file.originalname
                });

                // File metadata will be stored after message is created

                // Clean up local file
                fs.unlinkSync(file.path);
            }
        }

        // Determine content type
        let contentType: 'text' | 'image' | 'video' | 'file' = 'text';
        if (mediaFiles.length > 0) {
            const hasVideo = mediaFiles.some(f => f.type === 'video');
            contentType = hasVideo ? 'video' : 'image';
        }

        // Lấy senderInfo để embed vào message
        const senderUser = await _User.findById(senderId).select('name avt_url').lean();

        const message = await _Message.create({
            conversationId: new Types.ObjectId(conversationId),
            senderId: new Types.ObjectId(senderId),
            // Nhúng senderInfo — tránh $lookup khi getMessagesOfConversation
            senderInfo: senderUser ? {
                _id: senderUser._id,
                name: senderUser.name,
                avt_url: senderUser.avt_url
            } : undefined,
            content: content || (mediaFiles.length > 0 ? 'Đã gửi tệp đính kèm' : ''),
            contentType,
            mediaFiles,
            type,
            isRead: false
        });

        if (mediaFiles.length > 0) {
            const fileDocs = mediaFiles.map((file) => ({
                secure_url: file.url,
                bytes: file.size || file.fileSize || 0,
                public_id: file.publicId || file.fileName || file.filename || `message-${Date.now()}`,
                folder: `messages/${conversationId}`,
                resource_type: file.type || file.resourceType || 'image',
                messageId: message._id,
                conversationId: new Types.ObjectId(conversationId),
                uploadedBy: new Types.ObjectId(senderId)
            }));

            await _File.insertMany(fileDocs);
        }

        await _Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: {
                text: message.content,
                senderName: senderUser?.name || '',
                createdAt: message.createdAt,
                messageId: message._id
            },
            updatedAt: new Date()
        });

        const populatedMessage = await _Message.findById(message._id).lean();

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

        const folder = 'messages';

        // Generate presigned URLs for multiple files
        const presignedUrls = [];

        for (let i = 0; i < fileCount; i++) {
            const fileKey = `${folder}/${conversationId}/${uuidv4()}`;
            const contentType = fileType === 'image' ? 'image/*' : 'video/*';

            const presignedData = await S3Service.getPresignedUploadUrl(
                fileKey,
                contentType,
                3600 // 1 hour expiration
            );

            presignedUrls.push({
                uploadUrl: presignedData.url,
                key: presignedData.key,
                fields: presignedData.fields
            });
        }

        return {
            bucket: BUCKET_NAME,
            region: process.env.AWS_REGION || 'us-east-1',
            folder,
            fileCount,
            fileType,
            presignedUrls
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
            const hasVideo = mediaFiles.some(f => f.type === 'video' || f.resourceType === 'video');
            message.contentType = hasVideo ? 'video' : 'image';
        }

        await message.save();

        for (const file of mediaFiles) {
            await _File.create({
                secure_url: file.url,
                bytes: file.size || file.fileSize || 0,
                public_id: file.publicId || file.fileName || file.filename || `message-${Date.now()}`,
                folder: `messages/${message.conversationId}`,
                resource_type: file.type || file.resourceType || 'image',
                messageId: message._id,
                conversationId: message.conversationId,
                uploadedBy: message.senderId
            });
        }

        return message;
    }
}

export default new MessageService();
