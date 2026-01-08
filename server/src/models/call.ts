import { Document, Schema, Types, model } from 'mongoose';

export interface ICall extends Document {
    callerId: Types.ObjectId;
    receiverId: Types.ObjectId;
    conversationId: Types.ObjectId;
    callType: 'video' | 'audio';
    status: 'calling' | 'accepted' | 'rejected' | 'missed' | 'ended';
    startTime?: Date;
    endTime?: Date;
    duration?: number; // in seconds
    createdAt: Date;
    updatedAt: Date;
}

const callSchema = new Schema<ICall>({
    callerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'conversations',
        required: true
    },
    callType: {
        type: String,
        enum: ['video', 'audio'],
        default: 'video'
    },
    status: {
        type: String,
        enum: ['calling', 'accepted', 'rejected', 'missed', 'ended'],
        default: 'calling'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'calls'
});

// Index for faster queries
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });
callSchema.index({ conversationId: 1, createdAt: -1 });

export default model<ICall>('Call', callSchema);
