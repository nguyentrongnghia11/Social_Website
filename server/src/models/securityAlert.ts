import { Schema, Document, model, Types } from 'mongoose';

export interface ISecurityAlert extends Document {
    _id: Types.ObjectId;
    type: 'suspicious-login' | 'multiple-failed-attempts' | 'ddos-attempt' | 'malicious-content' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    userId?: Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
    status: 'open' | 'acknowledged' | 'resolved' | 'false-positive';
    resolvedBy?: Types.ObjectId;
    resolvedAt?: Date;
    metadata?: any;
}

const securityAlertSchema = new Schema<ISecurityAlert>({
    type: {
        type: String,
        enum: ['suspicious-login', 'multiple-failed-attempts', 'ddos-attempt', 'malicious-content', 'other'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['open', 'acknowledged', 'resolved', 'false-positive'],
        default: 'open'
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, { timestamps: true });

securityAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });
securityAlertSchema.index({ userId: 1 });
securityAlertSchema.index({ ipAddress: 1 });

export default model<ISecurityAlert>('SecurityAlert', securityAlertSchema);
