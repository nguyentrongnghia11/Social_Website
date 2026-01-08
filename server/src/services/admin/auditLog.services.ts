import _AuditLog, { IAuditLog } from '../../models/auditLog';
import { Types } from 'mongoose';

export class AuditLogService {
    
    async createLog(data: {
        action: string;
        admin: Types.ObjectId;
        target: string;
        targetUser?: Types.ObjectId;
        targetId?: Types.ObjectId;
        reason?: string;
        ipAddress?: string;
        userAgent?: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        metadata?: any;
    }) {
        const log = await _AuditLog.create({
            ...data,
            severity: data.severity || 'low'
        });
        return log;
    }

    async getAuditLogs(filters: {
        page: number;
        limit: number;
        action?: string;
        admin?: string;
        severity?: string;
    }) {
        const { page, limit, action, admin, severity } = filters;
        const query: any = {};
        
        if (action) query.action = action;
        if (admin) query.admin = admin;
        if (severity) query.severity = severity;

        const skip = (page - 1) * limit;
        const logs = await _AuditLog.find(query)
            .populate('admin', 'name email')
            .populate('targetUser', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _AuditLog.countDocuments(query);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getAuditLogById(id: string) {
        const log = await _AuditLog.findById(id)
            .populate('admin', 'name email')
            .populate('targetUser', 'name email');
        return log;
    }
}
