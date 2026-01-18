import _User, { IUser } from '../../models/user';
import _Post from '../../models/post';
import _Comment from '../../models/comment';
import _Report from '../../models/report';
import _BannedWord from '../../models/bannedWord';
import _Media from '../../models/media';
import _Broadcast from '../../models/broadcast';
import _Banner from '../../models/banner';
import _Settings from '../../models/settings';
import { Types } from 'mongoose';

export class UserManagementService {
    
    async getUsers(filters: {
        page: number;
        limit: number;
        role?: string;
        status?: string;
        search?: string;
    }) {
        const { page, limit, role, status, search } = filters;
        const query: any = {};
        
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const users = await _User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _User.countDocuments(query);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getUserById(id: string) {
        const user = await _User.findById(id)
            .select('-password')
            .populate('postId');
        return user;
    }

    async updateUserRole(id: string, role: string) {
        const user = await _User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');
        return user;
    }

    async updateUserStatus(id: string, status: string) {
        const user = await _User.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-password');
        return user;
    }

    async deleteUser(id: string) {
        const user = await _User.findByIdAndDelete(id);
        return user;
    }

    async getUserHistory(id: string, filters: { page: number; limit: number }) {
        const { page, limit } = filters;
        const user = await _User.findById(id).select('loginHistory');
        
        if (!user) return null;

        const history = user.loginHistory || [];
        const total = history.length;
        const skip = (page - 1) * limit;
        
        return {
            history: history.slice(skip, skip + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getUserActivities(id: string, filters: { page: number; limit: number }) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;

        const posts = await _Post.find({ artistId: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const comments = await _Comment.find({ userId: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await _Post.countDocuments({ artistId: id });
        const totalComments = await _Comment.countDocuments({ userId: id });

        return {
            posts,
            comments,
            stats: {
                totalPosts,
                totalComments
            }
        };
    }

    async getUserStats() {
        const total = await _User.countDocuments();
        const active = await _User.countDocuments({ status: 'active' });
        const banned = await _User.countDocuments({ status: 'banned' });
        const suspended = await _User.countDocuments({ status: 'suspended' });
        
        const byRole = await _User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        return {
            total,
            active,
            banned,
            suspended,
            byRole
        };
    }
}

export class PostManagementService {
    
    async getPosts(filters: {
        page: number;
        limit: number;
        status?: string;
        visibility?: string;
        search?: string;
    }) {
        const { page, limit, status, visibility, search } = filters;
        const query: any = {};
        
        if (status) query.status = status;
        if (visibility) query.visibility = visibility;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const posts = await _Post.find(query)
            .populate('artistId', 'name email')
            .populate('comments')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await _Post.countDocuments(query);

        // Add counts for likes, comments, and reports
        const postsWithCounts = await Promise.all(
            posts.map(async (post: any) => {
                const reportCount = await _Report.countDocuments({
                    targetType: 'post',
                    targetId: post._id
                });

                return {
                    ...post,
                    likeCount: post.react?.length || 0,
                    commentCount: post.comments?.length || 0,
                    reportCount
                };
            })
        );

        return {
            posts: postsWithCounts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getPostById(id: string) {
        const post = await _Post.findById(id)
            .populate('artistId', 'name email')
            .populate('comments');
        return post;
    }

    async updatePostVisibility(id: string, visibility: string) {
        const post = await _Post.findByIdAndUpdate(
            id,
            { visibility },
            { new: true }
        );
        return post;
    }

    async deletePost(id: string) {
        const post = await _Post.findByIdAndDelete(id);
        return post;
    }

    async getPostStats() {
        const total = await _Post.countDocuments();
        const published = await _Post.countDocuments({ visibility: 'published' });
        const hidden = await _Post.countDocuments({ visibility: 'hidden' });
        const pending = await _Post.countDocuments({ status: 'pending' });

        return {
            total,
            published,
            hidden,
            pending
        };
    }
}

export class CommentManagementService {
    
    async getComments(filters: {
        page: number;
        limit: number;
        visibility?: string;
        search?: string;
    }) {
        try {
            const { page, limit, visibility, search } = filters;
            const query: any = {};
            
            if (visibility) query.visibility = visibility;
            if (search) {
                query.content = { $regex: search, $options: 'i' };
            }

            const skip = (page - 1) * limit;
            const comments = await _Comment.find(query)
                .populate('userId', 'name')
                .populate('postId', 'title')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean();

            const total = await _Comment.countDocuments(query);

            console.log ("comments found: ", comments.length)

            return {
                comments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in getComments service:', error);
            throw error;
        }
    }

    async getCommentById(id: string) {
        const comment = await _Comment.findById(id)
            .populate('userId', 'name email')
            .populate('postId', 'title');
        return comment;
    }

    async updateCommentVisibility(id: string, visibility: string) {

        console.log ("Updating comment visibility: ", id, visibility)

        const comment = await _Comment.findByIdAndUpdate(
            id,
            { visibility },
            { new: true }
        );
        return comment;
    }

    async deleteComment(id: string) {
        const comment = await _Comment.findByIdAndDelete(id);
        return comment;
    }
}

export class BannedWordService {
    
    async getBannedWords(filters: { page: number; limit: number; category?: string }) {
        const { page, limit, category } = filters;
        const query: any = { isActive: true };
        
        if (category) query.category = category;

        const skip = (page - 1) * limit;
        const words = await _BannedWord.find(query)
            .populate('addedBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _BannedWord.countDocuments(query);

        return {
            words,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async addBannedWord(data: { word: string; category: string; addedBy: Types.ObjectId }) {
        const word = await _BannedWord.create(data);
        return word;
    }

    async deleteBannedWord(id: string) {
        const word = await _BannedWord.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        return word;
    }
}

export class MediaManagementService {
    
    async getMedia(filters: {
        page: number;
        limit: number;
        type?: string;
        status?: string;
    }) {
        const { page, limit, type, status } = filters;
        const query: any = {};
        
        if (type) query.type = type;
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const media = await _Media.find(query)
            .populate('uploadedBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _Media.countDocuments(query);

        return {
            media,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getMediaStats() {
        const totalImages = await _Media.countDocuments({ type: 'image' });
        const totalVideos = await _Media.countDocuments({ type: 'video' });
        const blockedMedia = await _Media.countDocuments({ status: 'blocked' });
        
        const sizeResult = await _Media.aggregate([
            { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]);
        
        const totalSize = sizeResult.length > 0 ? sizeResult[0].totalSize : 0;

        return {
            totalImages,
            totalVideos,
            totalSize,
            blockedMedia
        };
    }

    async deleteMedia(id: string) {
        const media = await _Media.findByIdAndDelete(id);
        return media;
    }
}

export class ReportManagementService {
    
    async getReports(filters: {
        page: number;
        limit: number;
        status?: string;
        reason?: string;
    }) {
        const { page, limit, status, reason } = filters;
        const query: any = {};
        
        if (status) query.status = status;
        if (reason) query.reason = reason;

        const skip = (page - 1) * limit;
        const reports = await _Report.find(query)
            .populate('reportedBy', 'name email')
            .populate('targetUser', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _Report.countDocuments(query);

        return {
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getReportById(id: string) {
        const report = await _Report.findById(id)
            .populate('reportedBy', 'name email')
            .populate('targetUser', 'name email')
            .populate('reviewedBy', 'name email');
        return report;
    }

    async updateReportStatus(id: string, data: {
        status: string;
        reviewedBy: Types.ObjectId;
        reviewNote?: string;
    }) {
        const report = await _Report.findByIdAndUpdate(
            id,
            {
                ...data,
                reviewedAt: new Date()
            },
            { new: true }
        );
        return report;
    }

    async approveReport(id: string, reviewedBy: Types.ObjectId) {
        const report = await _Report.findByIdAndUpdate(
            id,
            {
                status: 'approved',
                reviewedBy,
                reviewedAt: new Date()
            },
            { new: true }
        );
        return report;
    }

    async rejectReport(id: string, reviewedBy: Types.ObjectId, reviewNote?: string) {
        const report = await _Report.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                reviewedBy,
                reviewedAt: new Date(),
                reviewNote
            },
            { new: true }
        );
        return report;
    }

    async deleteReportedContent(reportId: string) {
        const report = await _Report.findById(reportId);
        if (!report) return null;

        if (report.targetType === 'post') {
            await _Post.findByIdAndDelete(report.targetId);
        } else if (report.targetType === 'comment') {
            await _Comment.findByIdAndDelete(report.targetId);
        }

        await _Report.findByIdAndUpdate(reportId, {
            action: 'content-deleted'
        });

        return report;
    }

    async banReportedUser(reportId: string) {
        const report = await _Report.findById(reportId);
        if (!report) return null;

        await _User.findByIdAndUpdate(report.targetUser, {
            status: 'banned'
        });

        await _Report.findByIdAndUpdate(reportId, {
            action: 'user-banned'
        });

        return report;
    }

    async getReportStats() {
        const total = await _Report.countDocuments();
        const pending = await _Report.countDocuments({ status: 'pending' });
        const approved = await _Report.countDocuments({ status: 'approved' });
        const rejected = await _Report.countDocuments({ status: 'rejected' });
        
        const byReason = await _Report.aggregate([
            { $group: { _id: '$reason', count: { $sum: 1 } } }
        ]);

        return {
            total,
            pending,
            approved,
            rejected,
            byReason
        };
    }
}

export class AnalyticsService {
    
    async getOverview() {
        const totalUsers = await _User.countDocuments();
        const totalPosts = await _Post.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newUsersToday = await _User.countDocuments({
            createdAt: { $gte: today }
        });

        const postsToday = await _Post.countDocuments({
            createdAt: { $gte: today }
        });

        const commentsToday = await _Comment.countDocuments({
            createdAt: { $gte: today }
        });

        return {
            totalUsers,
            newUsersToday,
            totalPosts,
            postsToday,
            commentsToday,
            engagement: {
                posts: postsToday,
                comments: commentsToday
            }
        };
    }

    async getUsersAnalytics(timeRange: string) {
        const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const growth = await _User.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const totalUsers = await _User.countDocuments();
        const activeUsers = await _User.countDocuments({
            lastLoginAt: { $gte: startDate }
        });

        return {
            dau: activeUsers,
            mau: totalUsers,
            growth
        };
    }

    async getEngagementAnalytics(timeRange: string) {
        const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const posts = await _Post.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    posts: { $sum: 1 },
                    likes: { $sum: { $size: '$react' } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const comments = await _Comment.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    comments: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return { posts, comments };
    }

    async getContentAnalytics() {
        const topPosts = await _Post.find()
            .sort({ react: -1 })
            .limit(10)
            .populate('artistId', 'name');

        const topAuthors = await _Post.aggregate([
            {
                $group: {
                    _id: '$artistId',
                    postCount: { $sum: 1 },
                    totalLikes: { $sum: { $size: '$react' } }
                }
            },
            { $sort: { postCount: -1 } },
            { $limit: 10 }
        ]);

        return {
            topPosts,
            topAuthors
        };
    }

    async getRealtimeStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeNow = await _User.countDocuments({
            lastLoginAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
        });

        const postsToday = await _Post.countDocuments({
            createdAt: { $gte: today }
        });

        const commentsToday = await _Comment.countDocuments({
            createdAt: { $gte: today }
        });

        return {
            activeNow,
            postsToday,
            commentsToday
        };
    }
}

export class BroadcastService {
    
    async getBroadcasts(filters: { page: number; limit: number }) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;

        const broadcasts = await _Broadcast.find()
            .populate('sentBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await _Broadcast.countDocuments();

        return {
            broadcasts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getBroadcastById(id: string) {
        const broadcast = await _Broadcast.findById(id)
            .populate('sentBy', 'name email');
        return broadcast;
    }

    async createBroadcast(data: {
        title: string;
        message: string;
        type: string;
        sentBy: Types.ObjectId;
    }) {
        const userCount = await _User.countDocuments({ status: 'active' });
        
        const broadcast = await _Broadcast.create({
            ...data,
            recipientCount: userCount,
            status: 'sent'
        });

        // TODO: Implement actual notification sending logic here
        // You can use the existing notification service

        return broadcast;
    }
}

export class BannerService {
    
    async getBanners(filters: { page: number; limit: number; active?: boolean }) {
        const { page, limit, active } = filters;
        const query: any = {};
        
        if (active !== undefined) query.active = active;

        const skip = (page - 1) * limit;
        const banners = await _Banner.find(query)
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ order: 1, createdAt: -1 });

        const total = await _Banner.countDocuments(query);

        return {
            banners,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async createBanner(data: {
        title: string;
        position: string;
        imageUrl: string;
        link?: string;
        active: boolean;
        createdBy: Types.ObjectId;
    }) {
        const banner = await _Banner.create(data);
        return banner;
    }

    async updateBanner(id: string, data: any) {
        const banner = await _Banner.findByIdAndUpdate(id, data, { new: true });
        return banner;
    }

    async deleteBanner(id: string) {
        const banner = await _Banner.findByIdAndDelete(id);
        return banner;
    }

    async toggleBanner(id: string) {
        const banner = await _Banner.findById(id);
        if (!banner) return null;
        
        banner.active = !banner.active;
        await banner.save();
        return banner;
    }
}

export class SettingsService {
    
    async getSettings() {
        let settings = await _Settings.findOne();
        
        if (!settings) {
            settings = await _Settings.create({
                contactEmail: 'admin@example.com'
            });
        }
        
        return settings;
    }

    async updateSettings(data: any, updatedBy: Types.ObjectId) {
        let settings = await _Settings.findOne();
        
        if (!settings) {
            settings = await _Settings.create({
                ...data,
                updatedBy
            });
        } else {
            Object.assign(settings, data, { updatedBy });
            await settings.save();
        }
        
        return settings;
    }
}

export default {
    userManagementService: new UserManagementService(),
    postManagementService: new PostManagementService(),
    commentManagementService: new CommentManagementService(),
    bannedWordService: new BannedWordService(),
    mediaManagementService: new MediaManagementService(),
    reportManagementService: new ReportManagementService(),
    analyticsService: new AnalyticsService(),
    broadcastService: new BroadcastService(),
    bannerService: new BannerService(),
    settingsService: new SettingsService()
};