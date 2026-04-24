import { Document, Schema, Types, model } from 'mongoose'

// Snapshot thông tin participant — embed để tránh $lookup user
export interface IParticipantSnapshot {
    _id: Types.ObjectId;
    name: string;
    avt_url?: string;
    email?: string;
}

interface Conversation extends Document {
    type: "group" | "user";
    // Mảng ID để query
    participantIds: Types.ObjectId[];
    // Snapshot hiển thị
    participants?: IParticipantSnapshot[];
    // Group info (chỉ dùng khi type = group)
    groupInfo?: {
        groupId?: Types.ObjectId;
        name?: string;
        avatar?: string;
    };
    // Tin nhắn cuối để list nhanh
    lastMessage?: {
        text?: string;
        senderName?: string;
        createdAt?: Date;
        messageId?: Types.ObjectId;
    };
}

const participantSnapshotSchema = new Schema<IParticipantSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    avt_url: { type: String },
    email: { type: String }
}, { _id: false });

const conversationsSchema = new Schema<Conversation>({
    type: { type: String, enum: ["group", "user"], required: true },
    // 1) Mảng ID để query
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    // 2) Snapshot hiển thị
    participants: { type: [participantSnapshotSchema], default: [] },
    // 3) Group info
    groupInfo: {
        groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
        name: { type: String },
        avatar: { type: String }
    },
    // 4) Tin nhắn cuối
    lastMessage: {
        text: { type: String },
        senderName: { type: String },
        createdAt: { type: Date },
        messageId: { type: Schema.Types.ObjectId, ref: 'message' }
    }
}, {
    timestamps: true,
    collection: 'conversations'
});

// Indexes
conversationsSchema.index({ participantIds: 1, type: 1 });           // query conversations của user
conversationsSchema.index({ 'participants._id': 1 });               // query conversations của user
conversationsSchema.index({ type: 1, updatedAt: -1 });              // sort conversations

export default model<Conversation>('conversations', conversationsSchema);