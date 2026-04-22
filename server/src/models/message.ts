import { Schema, model, Document, Types } from 'mongoose'

export interface IMediaFile {
    url: string;
    type?: 'image' | 'video' | 'audio' | 'file';
    resourceType?: string;
    format?: string;
    size?: number;
    fileName?: string;
    fileSize?: number;
    filename?: string;
    publicId?: string;
}

// Snapshot thông tin người gửi — embed để tránh $lookup khi lấy messages
export interface ISenderSnapshot {
    _id: Types.ObjectId;
    name: string;
    avt_url?: string;
}

export interface IMessage extends Document {
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
    senderInfo?: ISenderSnapshot;      // Extended Reference: snapshot tại thời điểm gửi
    content: {
        type: String,
        required: true
    },
    type: "user" | "group",
    contentType: "text" | "image" | "video" | "audio" | "file",
    mediaFiles?: IMediaFile[],
    isRead: boolean,
    createdAt: Date;
    updatedAt: Date;
}

const senderSnapshotSchema = new Schema<ISenderSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    avt_url: { type: String }
}, { _id: false });

const messageSchema = new Schema<IMessage>({
    conversationId: {
        type: Schema.Types.ObjectId,
        required: true,
    },

    type: {
        type: String,
        enum: ["user", "group"],
    },

    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Extended Reference: embed sender info để tránh $lookup khi getMessagesOfConversation
    senderInfo: {
        type: senderSnapshotSchema,
        required: false
    },

    content: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: ["text", "image", "video", "audio", "file"],
        default: "text"
    },
    mediaFiles: [
        {
            url: { type: String, required: true },
            type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
            resourceType: { type: String },
            format: { type: String },
            size: { type: Number },
            fileName: { type: String },
            fileSize: { type: Number },
            filename: { type: String },
            publicId: { type: String }
        }
    ],
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'messages'
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });   // lấy messages của conversation
messageSchema.index({ conversationId: 1, senderId: 1 });     // query messages của sender trong conv
messageSchema.index({ conversationId: 1, isRead: 1 });       // đếm unread

export default model<IMessage>('message', messageSchema);