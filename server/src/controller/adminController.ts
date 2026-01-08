import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/user';
import { ErrorApi } from '../middleware/error';
import { Types } from 'mongoose';
import adminServices from '../services/admin/admin.services';
import { AuditLogService } from '../services/admin/auditLog.services';

class AdminController {
    private userService = adminServices.userManagementService;
    private postService = adminServices.postManagementService;
    private commentService = adminServices.commentManagementService;
    private bannedWordService = adminServices.bannedWordService;
    private mediaService = adminServices.mediaManagementService;
    private reportService = adminServices.reportManagementService;
    private analyticsService = adminServices.analyticsService;
    private broadcastService = adminServices.broadcastService;
    private bannerService = adminServices.bannerService;
    private settingsService = adminServices.settingsService;
    private auditLogService = new AuditLogService();


    constructor() {
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => name !== 'constructor' && typeof (this as any)[name] === 'function')
            .forEach(name => {
                (this as any)[name] = (this as any)[name].bind(this);
            });
    }


    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const role = req.query.role as string;
            const status = req.query.status as string;
            const search = req.query.search as string;

            const result = await this.userService.getUsers({
                page, limit, role, status, search
            });

            res.json({
                status: 200,
                data: result.users,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            if (!user) {
                throw new ErrorApi(404, 'User not found');
            }

            res.json({
                status: 200,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const admin = req.user as IUser;

            const user = await this.userService.updateUserRole(id, role);

            if (!user) {
                throw new ErrorApi(404, 'User not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_USER_ROLE',
                admin: admin._id,
                target: 'user',
                targetUser: user._id,
                targetId: user._id,
                reason: `Changed role to ${role}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'medium'
            });

            res.json({
                status: 200,
                message: 'User role updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const admin = req.user as IUser;

            const user = await this.userService.updateUserStatus(id, status);

            if (!user) {
                throw new ErrorApi(404, 'User not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_USER_STATUS',
                admin: admin._id,
                target: 'user',
                targetUser: user._id,
                targetId: user._id,
                reason: `Changed status to ${status}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: status === 'banned' ? 'high' : 'medium'
            });

            res.json({
                status: 200,
                message: 'User status updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const user = await this.userService.deleteUser(id);

            if (!user) {
                throw new ErrorApi(404, 'User not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_USER',
                admin: admin._id,
                target: 'user',
                targetUser: user._id,
                targetId: user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'high'
            });

            res.json({
                status: 200,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.userService.getUserHistory(id, { page, limit });

            if (!result) {
                throw new ErrorApi(404, 'User not found');
            }

            res.json({
                status: 200,
                data: result.history,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserActivities(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.userService.getUserActivities(id, { page, limit });

            res.json({
                status: 200,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await this.userService.getUserStats();

            res.json({
                status: 200,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }


    async getPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status as string;
            const visibility = req.query.visibility as string;
            const search = req.query.search as string;

            const result = await this.postService.getPosts({
                page, limit, status, visibility, search
            });

            res.json({
                status: 200,
                data: result.posts,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const post = await this.postService.getPostById(id);

            if (!post) {
                throw new ErrorApi(404, 'Post not found');
            }

            res.json({
                status: 200,
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePostVisibility(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const admin = req.user as IUser;

            const post = await this.postService.updatePostVisibility(id, status);

            if (!post) {
                throw new ErrorApi(404, 'Post not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_POST_VISIBILITY',
                admin: admin._id,
                target: 'post',
                targetId: post._id as Types.ObjectId,
                reason: `Changed visibility to ${status}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Post visibility updated successfully',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePost(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const post = await this.postService.deletePost(id);

            if (!post) {
                throw new ErrorApi(404, 'Post not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_POST',
                admin: admin._id,
                target: 'post',
                targetId: post._id as Types.ObjectId,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'medium'
            });

            res.json({
                status: 200,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await this.postService.getPostStats();

            res.json({
                status: 200,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }


    async getComments(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const visibility = req.query.visibility as string;
            const search = req.query.search as string;

            const result = await this.commentService.getComments({
                page, limit, visibility, search
            });

            res.json({
                status: 200,
                data: result.comments,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getCommentById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const comment = await this.commentService.getCommentById(id);

            if (!comment) {
                throw new ErrorApi(404, 'Comment not found');
            }

            res.json({
                status: 200,
                data: comment
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCommentVisibility(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const admin = req.user as IUser;

            const comment = await this.commentService.updateCommentVisibility(id, status);

            if (!comment) {
                throw new ErrorApi(404, 'Comment not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_COMMENT_VISIBILITY',
                admin: admin._id,
                target: 'comment',
                targetId: comment._id,
                reason: `Changed visibility to ${status}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Comment visibility updated successfully',
                data: comment
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const comment = await this.commentService.deleteComment(id);

            if (!comment) {
                throw new ErrorApi(404, 'Comment not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_COMMENT',
                admin: admin._id,
                target: 'comment',
                targetId: comment._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'medium'
            });

            res.json({
                status: 200,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }


    async getBannedWords(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const category = req.query.category as string;

            const result = await this.bannedWordService.getBannedWords({
                page, limit, category
            });

            res.json({
                status: 200,
                data: result.words,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async addBannedWord(req: Request, res: Response, next: NextFunction) {
        try {
            const { word, category } = req.body;
            const admin = req.user as IUser;

            const bannedWord = await this.bannedWordService.addBannedWord({
                word,
                category,
                addedBy: admin._id
            });

            await this.auditLogService.createLog({
                action: 'ADD_BANNED_WORD',
                admin: admin._id,
                target: 'banned-word',
                targetId: bannedWord._id,
                reason: `Added banned word: ${word}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banned word added successfully',
                data: bannedWord
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBannedWord(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const word = await this.bannedWordService.deleteBannedWord(id);

            if (!word) {
                throw new ErrorApi(404, 'Banned word not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_BANNED_WORD',
                admin: admin._id,
                target: 'banned-word',
                targetId: word._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banned word deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getMedia(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const type = req.query.type as string;
            const status = req.query.status as string;

            const result = await this.mediaService.getMedia({
                page, limit, type, status
            });

            res.json({
                status: 200,
                data: result.media,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getMediaStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await this.mediaService.getMediaStats();

            res.json({
                status: 200,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteMedia(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const media = await this.mediaService.deleteMedia(id);

            if (!media) {
                throw new ErrorApi(404, 'Media not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_MEDIA',
                admin: admin._id,
                target: 'media',
                targetId: media._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Media deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }


    async getReports(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status as string;
            const reason = req.query.reason as string;

            const result = await this.reportService.getReports({
                page, limit, status, reason
            });

            res.json({
                status: 200,
                data: result.reports,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getReportById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const report = await this.reportService.getReportById(id);

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            res.json({
                status: 200,
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async updateReportStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, reviewNote } = req.body;
            const admin = req.user as IUser;

            const report = await this.reportService.updateReportStatus(id, {
                status,
                reviewedBy: admin._id,
                reviewNote
            });

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_REPORT_STATUS',
                admin: admin._id,
                target: 'report',
                targetId: report._id,
                reason: `Updated status to ${status}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Report status updated successfully',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async approveReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const report = await this.reportService.approveReport(id, admin._id);

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            await this.auditLogService.createLog({
                action: 'APPROVE_REPORT',
                admin: admin._id,
                target: 'report',
                targetId: report._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'medium'
            });

            res.json({
                status: 200,
                message: 'Report approved successfully',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async rejectReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { reviewNote } = req.body;
            const admin = req.user as IUser;

            const report = await this.reportService.rejectReport(id, admin._id, reviewNote);

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            await this.auditLogService.createLog({
                action: 'REJECT_REPORT',
                admin: admin._id,
                target: 'report',
                targetId: report._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Report rejected successfully',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteReportedContent(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const report = await this.reportService.deleteReportedContent(id);

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_REPORTED_CONTENT',
                admin: admin._id,
                target: 'report',
                targetId: report._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'high'
            });

            res.json({
                status: 200,
                message: 'Reported content deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async banReportedUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const report = await this.reportService.banReportedUser(id);

            if (!report) {
                throw new ErrorApi(404, 'Report not found');
            }

            await this.auditLogService.createLog({
                action: 'BAN_REPORTED_USER',
                admin: admin._id,
                target: 'report',
                targetId: report._id,
                targetUser: report.targetUser,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'critical'
            });

            res.json({
                status: 200,
                message: 'User banned successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getReportStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await this.reportService.getReportStats();

            res.json({
                status: 200,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }


    async getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const overview = await this.analyticsService.getOverview();

            res.json({
                status: 200,
                data: overview
            });
        } catch (error) {
            next(error);
        }
    }

    async getUsersAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const timeRange = (req.query.timeRange as string) || '7days';
            const analytics = await this.analyticsService.getUsersAnalytics(timeRange);

            res.json({
                status: 200,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async getEngagementAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const timeRange = (req.query.timeRange as string) || '7days';
            const analytics = await this.analyticsService.getEngagementAnalytics(timeRange);

            res.json({
                status: 200,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async getContentAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const analytics = await this.analyticsService.getContentAnalytics();

            res.json({
                status: 200,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async getRealtimeStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await this.analyticsService.getRealtimeStats();

            res.json({
                status: 200,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }


    async getBroadcasts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.broadcastService.getBroadcasts({ page, limit });

            res.json({
                status: 200,
                data: result.broadcasts,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getBroadcastById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const broadcast = await this.broadcastService.getBroadcastById(id);

            if (!broadcast) {
                throw new ErrorApi(404, 'Broadcast not found');
            }

            res.json({
                status: 200,
                data: broadcast
            });
        } catch (error) {
            next(error);
        }
    }

    async createBroadcast(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, message, type } = req.body;
            const admin = req.user as IUser;

            const broadcast = await this.broadcastService.createBroadcast({
                title,
                message,
                type,
                sentBy: admin._id
            });

            await this.auditLogService.createLog({
                action: 'CREATE_BROADCAST',
                admin: admin._id,
                target: 'broadcast',
                targetId: broadcast._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'medium'
            });

            res.json({
                status: 200,
                message: 'Broadcast sent successfully',
                data: broadcast
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== BANNERS ====================

    async getBanners(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

            const result = await this.bannerService.getBanners({ page, limit, active });

            res.json({
                status: 200,
                data: result.banners,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async createBanner(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, position, imageUrl, link, active } = req.body;
            const admin = req.user as IUser;

            const banner = await this.bannerService.createBanner({
                title,
                position,
                imageUrl,
                link,
                active,
                createdBy: admin._id
            });

            await this.auditLogService.createLog({
                action: 'CREATE_BANNER',
                admin: admin._id,
                target: 'banner',
                targetId: banner._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banner created successfully',
                data: banner
            });
        } catch (error) {
            next(error);
        }
    }

    async updateBanner(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const banner = await this.bannerService.updateBanner(id, req.body);

            if (!banner) {
                throw new ErrorApi(404, 'Banner not found');
            }

            await this.auditLogService.createLog({
                action: 'UPDATE_BANNER',
                admin: admin._id,
                target: 'banner',
                targetId: banner._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banner updated successfully',
                data: banner
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBanner(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const banner = await this.bannerService.deleteBanner(id);

            if (!banner) {
                throw new ErrorApi(404, 'Banner not found');
            }

            await this.auditLogService.createLog({
                action: 'DELETE_BANNER',
                admin: admin._id,
                target: 'banner',
                targetId: banner._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banner deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleBanner(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const admin = req.user as IUser;

            const banner = await this.bannerService.toggleBanner(id);

            if (!banner) {
                throw new ErrorApi(404, 'Banner not found');
            }

            await this.auditLogService.createLog({
                action: 'TOGGLE_BANNER',
                admin: admin._id,
                target: 'banner',
                targetId: banner._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'low'
            });

            res.json({
                status: 200,
                message: 'Banner toggled successfully',
                data: banner
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== AUDIT LOGS ====================

    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const action = req.query.action as string;
            const admin = req.query.admin as string;
            const severity = req.query.severity as string;

            const result = await this.auditLogService.getAuditLogs({
                page, limit, action, admin, severity
            });

            res.json({
                status: 200,
                data: result.logs,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getAuditLogById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const log = await this.auditLogService.getAuditLogById(id);

            if (!log) {
                throw new ErrorApi(404, 'Audit log not found');
            }

            res.json({
                status: 200,
                data: log
            });
        } catch (error) {
            next(error);
        }
    }




    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await this.settingsService.getSettings();

            res.json({
                status: 200,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }

    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const admin = req.user as IUser;
            const settings = await this.settingsService.updateSettings(req.body, admin._id);

            await this.auditLogService.createLog({
                action: 'UPDATE_SETTINGS',
                admin: admin._id,
                target: 'settings',
                targetId: settings._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                severity: 'high'
            });

            res.json({
                status: 200,
                message: 'Settings updated successfully',
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }


    async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const overview = await this.analyticsService.getOverview();
            const userStats = await this.userService.getUserStats();
            const postStats = await this.postService.getPostStats();
            const reportStats = await this.reportService.getReportStats();

            res.json({
                status: 200,
                data: {
                    overview,
                    userStats,
                    postStats,
                    reportStats
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getRecentActivities(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.auditLogService.getAuditLogs({
                page,
                limit
            });

            res.json({
                status: 200,
                data: result.logs
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AdminController();
