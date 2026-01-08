import { Schema, Document, model, Types } from 'mongoose';

export interface IReport extends Document {
    _id: Types.ObjectId;
    reportedBy: Types.ObjectId;
    targetType: 'post' | 'comment' | 'user';
    targetId: Types.ObjectId;
    targetUser: Types.ObjectId;
    reason: 'spam' | 'hate-speech' | 'fraud' | 'adult' | 'violence' | 'harassment' | 'other';
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    reviewNote?: string;
    action?: 'none' | 'content-deleted' | 'user-warned' | 'user-banned';
}

const reportSchema = new Schema<IReport>({
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['post', 'comment', 'user'],
        required: true
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType'
    },
    targetUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['spam', 'hate-speech', 'fraud', 'adult', 'violence', 'harassment', 'other'],
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    reviewNote: {
        type: String
    },
    action: {
        type: String,
        enum: ['none', 'content-deleted', 'user-warned', 'user-banned'],
        default: 'none'
    }
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ reason: 1 });

export default model<IReport>('Report', reportSchema);
