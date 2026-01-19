import { Router } from 'express';
import adminController from '../controller/adminController';
import { authenticateMiddleware } from '../middleware/verifyToken';
import { checkPermisson } from '../middleware/checkPermission';
import { Permission } from '../enums/permission.enum';

const router = Router();

router.use(authenticateMiddleware);
router.use(checkPermisson(Permission.MANAGER_USER));

// Permission management routes
router.get('/permissions', adminController.getAvailablePermissions);

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/users/:id/permissions', adminController.getUserPermissions);
router.put('/users/:id/permissions', adminController.updateUserPermissions);
router.post('/users/:id/permissions', adminController.addUserPermission);
router.delete('/users/:id/permissions/:permission', adminController.removeUserPermission);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/history', adminController.getUserHistory);
router.get('/users/:id/activities', adminController.getUserActivities);

router.get('/posts', adminController.getPosts);
router.get('/posts/stats', adminController.getPostStats);
router.get('/posts/:id', adminController.getPostById);
router.put('/posts/:id/visibility', adminController.updatePostVisibility);
router.delete('/posts/:id', adminController.deletePost);

router.get('/comments', adminController.getComments);
router.get('/comments/:id', adminController.getCommentById);
router.put('/comments/:id/visibility', adminController.updateCommentVisibility);
router.delete('/comments/:id', adminController.deleteComment);

router.get('/banned-words', adminController.getBannedWords);
router.post('/banned-words', adminController.addBannedWord);
router.delete('/banned-words/:id', adminController.deleteBannedWord);

router.get('/media', adminController.getMedia);
router.get('/media/stats', adminController.getMediaStats);
router.delete('/media/:id', adminController.deleteMedia);

router.get('/reports', adminController.getReports);
router.get('/reports/stats', adminController.getReportStats);
router.get('/reports/:id', adminController.getReportById);
router.put('/reports/:id/status', adminController.updateReportStatus);
router.post('/reports/:id/approve', adminController.approveReport);
router.post('/reports/:id/reject', adminController.rejectReport);
router.post('/reports/:id/delete-content', adminController.deleteReportedContent);
router.post('/reports/:id/ban-user', adminController.banReportedUser);

router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/users', adminController.getUsersAnalytics);
router.get('/analytics/engagement', adminController.getEngagementAnalytics);
router.get('/analytics/content', adminController.getContentAnalytics);
router.get('/analytics/realtime', adminController.getRealtimeStats);

router.get('/broadcasts', adminController.getBroadcasts);
router.get('/broadcasts/:id', adminController.getBroadcastById);
router.post('/broadcasts', adminController.createBroadcast);

router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);
router.put('/banners/:id/toggle', adminController.toggleBanner);

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/:id', adminController.getAuditLogById);



router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.get('/dashboard', adminController.getDashboard);
router.get('/activities/recent', adminController.getRecentActivities);

export default router;
