import { Schema, Document, model, Types } from 'mongoose';

export interface IBroadcast extends Document {
    _id: Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    sentBy: Types.ObjectId;
    recipientCount: number;
    status: 'draft' | 'sent' | 'failed';
}

const broadcastSchema = new Schema<IBroadcast>({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error'],
        default: 'info'
    },
    sentBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'failed'],
        default: 'draft'
    }
}, { timestamps: true });

broadcastSchema.index({ sentBy: 1, createdAt: -1 });
broadcastSchema.index({ status: 1 });

export default model<IBroadcast>('Broadcast', broadcastSchema);
