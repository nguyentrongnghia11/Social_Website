import { Schema, model, Document, Types } from 'mongoose'

export interface IMessage extends Document {
    conversationId: Types.ObjectId,
    senderId: Types.ObjectId,
    content: {
        type: String,
        required: true
    },
    type: "user" | "group",
    contentType: "text" | "image" | "video" | "audio",
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
        enum: ["text", "image", "video", "audio"],
        default: "text"
    },
    isRead: {
        type: Boolean,
        default: false
    }

}, {

    timestamps: true,
    collection: 'messages'
})

export default model<IMessage>('message', messageSchema);