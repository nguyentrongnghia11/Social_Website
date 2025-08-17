

import { Document, Schema, Types, model } from 'mongoose'
interface Conversation extends Document {

    groupId: Types.ObjectId,
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;
    type: "group" | "user"
}


const conversationsSchema = new Schema<Conversation>({

    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    senderId: {
        type: Schema.Types.ObjectId,
        required: function () {
            return this.groupId === null
        },
        ref: 'User',
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        required: function () {
            return this.groupId === null
        },
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: ["group", "user"],
    }
}, {

    timestamps: true,
    collection: 'conversations'
})

export default model<Conversation>('conversations', conversationsSchema);