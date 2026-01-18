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

export interface IMessage extends Document {
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
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


const messageSchema = new Schema<IMessage>({
    conversationId: {
        type: Schema.Types.ObjectId,
        required: true,
    },

    type: {
        type: String,
        enum: ["user", "group"],
    }
    ,

    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
})

export default model<IMessage>('message', messageSchema);