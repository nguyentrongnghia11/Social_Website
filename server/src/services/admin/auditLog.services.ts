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
        if (admin) query.admin = new Types.ObjectId(admin);
        if (severity) query.severity = severity;

        const skip = (page - 1) * limit;
        const logs = await _AuditLog.find(query)
            .populate('admin', 'name email')
            .populate('targetUser', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await _AuditLog.countDocuments(query);

        // Format logs for frontend display
        const formattedLogs = logs.map((log: any) => {
            const actionLabels: Record<string, string> = {
                'CREATE_USER': 'Tạo người dùng mới',
                'UPDATE_USER_ROLE': 'Cập nhật vai trò người dùng',
                'UPDATE_USER_STATUS': 'Cập nhật trạng thái người dùng',
                'DELETE_USER': 'Xóa người dùng',
                'UPDATE_POST_VISIBILITY': 'Cập nhật hiển thị bài viết',
                'DELETE_POST': 'Xóa bài viết',
                'UPDATE_COMMENT_VISIBILITY': 'Cập nhật hiển thị bình luận',
                'DELETE_COMMENT': 'Xóa bình luận',
                'APPROVE_REPORT': 'Phê duyệt báo cáo',
                'REJECT_REPORT': 'Từ chối báo cáo',
                'DELETE_REPORTED_CONTENT': 'Xóa nội dung bị báo cáo',
                'BAN_REPORTED_USER': 'Khóa người dùng vi phạm',
                'CREATE_BANNER': 'Tạo banner mới',
                'UPDATE_BANNER': 'Cập nhật banner',
                'DELETE_BANNER': 'Xóa banner',
            };

            const typeMap: Record<string, string> = {
                'user': 'user',
                'post': 'post',
                'comment': 'comment',
                'report': 'report',
                'banner': 'banner',
            };

            return {
                _id: log._id,
                type: typeMap[log.target] || 'other',
                action: actionLabels[log.action] || log.action,
                user: log.admin?.name || 'Unknown',
                time: formatRelativeTime(log.createdAt),
                createdAt: log.createdAt
            };
        });

        return {
            logs: formattedLogs,
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

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(date).toLocaleDateString('vi-VN');
}
