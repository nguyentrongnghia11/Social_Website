import { Schema, Document, model, Types } from 'mongoose';

export interface IAuditLog extends Document {
    _id: Types.ObjectId;
    action: string;
    admin: Types.ObjectId;
    target: string;
    targetUser?: Types.ObjectId;
    targetId?: Types.ObjectId;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}

const auditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        required: true
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    target: {
        type: String,
        required: true
    },
    targetUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    targetId: {
        type: Schema.Types.ObjectId
    },
    reason: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, { timestamps: true });

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ targetUser: 1 });

export default model<IAuditLog>('AuditLog', auditLogSchema);
