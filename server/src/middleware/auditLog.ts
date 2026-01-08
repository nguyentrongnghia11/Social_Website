import { Request, Response, NextFunction } from 'express';
import _AuditLog from '../models/auditLog';
import { IUser } from '../models/user';

export const auditLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;

    res.json = function (data: any) {
        // Only log successful operations (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const admin = req.user as IUser;
            const method = req.method;
            const path = req.path;

            // Determine action based on method and path
            let action = '';
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

            if (method === 'DELETE') {
                action = `DELETE_${path.split('/')[1].toUpperCase()}`;
                severity = 'high';
            } else if (method === 'PUT' || method === 'PATCH') {
                action = `UPDATE_${path.split('/')[1].toUpperCase()}`;
                severity = 'medium';
            } else if (method === 'POST') {
                action = `CREATE_${path.split('/')[1].toUpperCase()}`;
                severity = 'medium';
            }

            if (action && admin) {
                // Log asynchronously without blocking response
                _AuditLog.create({
                    action,
                    admin: admin._id,
                    target: path.split('/')[1],
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    severity,
                    metadata: {
                        method,
                        path,
                        query: req.query,
                        body: req.body
                    }
                }).catch(err => console.error('Audit log error:', err));
            }
        }

        return originalSend.call(this, data);
    };

    next();
};
