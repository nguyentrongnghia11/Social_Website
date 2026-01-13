import { instance } from "../config";

// User Management
export const getUsers = (params) => {
  return instance.get('/admin/users', { params });
};

export const getUserStats = () => {
  return instance.get('/admin/users/stats');
};

export const getUserById = (id) => {
  return instance.get(`/admin/users/${id}`);
};

export const updateUserRole = (id, role) => {
  return instance.put(`/admin/users/${id}/role`, { role });
};

export const updateUserStatus = (id, status) => {
  return instance.put(`/admin/users/${id}/status`, { status });
};

export const deleteUser = (id) => {
  return instance.delete(`/admin/users/${id}`);
};

export const getUserHistory = (id) => {
  return instance.get(`/admin/users/${id}/history`);
};

export const getUserActivities = (id) => {
  return instance.get(`/admin/users/${id}/activities`);
};

// Post Management
export const getPosts = (params) => {
  return instance.get('/admin/posts', { params });
};

export const getPostStats = () => {
  return instance.get('/admin/posts/stats');
};

export const getPostById = (id) => {
  return instance.get(`/admin/posts/${id}`);
};

export const updatePostVisibility = (id, status) => {
  return instance.put(`/admin/posts/${id}/visibility`, { status });
};

export const deletePost = (id) => {
  return instance.delete(`/admin/posts/${id}`);
};

// Comment Management
export const getComments = (params) => {
  return instance.get('/admin/comments', { params });
};

export const getCommentById = (id) => {
  return instance.get(`/admin/comments/${id}`);
};

export const updateCommentVisibility = (id, status) => {
  return instance.put(`/admin/comments/${id}/visibility`, { status });
};

export const deleteComment = (id) => {
  return instance.delete(`/admin/comments/${id}`);
};

// Banned Words
export const getBannedWords = () => {
  return instance.get('/admin/banned-words');
};

export const addBannedWord = (data) => {
  return instance.post('/admin/banned-words', data);
};

export const deleteBannedWord = (id) => {
  return instance.delete(`/admin/banned-words/${id}`);
};

// Media Management
export const getMedia = (params) => {
  return instance.get('/admin/media', { params });
};

export const getMediaStats = () => {
  return instance.get('/admin/media/stats');
};

export const deleteMedia = (id) => {
  return instance.delete(`/admin/media/${id}`);
};

// Reports
export const getReports = (params) => {
  return instance.get('/admin/reports', { params });
};

export const getReportStats = () => {
  return instance.get('/admin/reports/stats');
};

export const getReportById = (id) => {
  return instance.get(`/admin/reports/${id}`);
};

export const updateReportStatus = (id, status) => {
  return instance.put(`/admin/reports/${id}/status`, { status });
};

export const approveReport = (id) => {
  return instance.post(`/admin/reports/${id}/approve`);
};

export const rejectReport = (id) => {
  return instance.post(`/admin/reports/${id}/reject`);
};

export const deleteReportedContent = (id) => {
  return instance.post(`/admin/reports/${id}/delete-content`);
};

export const banReportedUser = (id) => {
  return instance.post(`/admin/reports/${id}/ban-user`);
};

// Analytics
export const getAnalyticsOverview = () => {
  return instance.get('/admin/analytics/overview');
};

export const getAnalyticsUsers = (params) => {
  return instance.get('/admin/analytics/users', { params });
};

export const getAnalyticsEngagement = (params) => {
  return instance.get('/admin/analytics/engagement', { params });
};

export const getAnalyticsContent = () => {
  return instance.get('/admin/analytics/content');
};

export const getAnalyticsRealtime = () => {
  return instance.get('/admin/analytics/realtime');
};

// Broadcasts
export const getBroadcasts = () => {
  return instance.get('/admin/broadcasts');
};

export const getBroadcastById = (id) => {
  return instance.get(`/admin/broadcasts/${id}`);
};

export const createBroadcast = (data) => {
  return instance.post('/admin/broadcasts', data);
};

// Banners
export const getBanners = () => {
  return instance.get('/admin/banners');
};

export const createBanner = (data) => {
  return instance.post('/admin/banners', data);
};

export const updateBanner = (id, data) => {
  return instance.put(`/admin/banners/${id}`, data);
};

export const deleteBanner = (id) => {
  return instance.delete(`/admin/banners/${id}`);
};

export const toggleBanner = (id) => {
  return instance.put(`/admin/banners/${id}/toggle`);
};

// Audit Logs
export const getAuditLogs = (params) => {
  return instance.get('/admin/audit-logs', { params });
};

export const getAuditLogById = (id) => {
  return instance.get(`/admin/audit-logs/${id}`);
};

// System
export const getSystemMetrics = () => {
  return instance.get('/admin/system/metrics');
};

export const getSystemMetricsHistory = () => {
  return instance.get('/admin/system/metrics/history');
};

export const getSystemPerformance = () => {
  return instance.get('/admin/system/performance');
};

// Security
export const getSecurityAlerts = () => {
  return instance.get('/admin/security/alerts');
};

export const createSecurityAlert = (data) => {
  return instance.post('/admin/security/alerts', data);
};

export const updateSecurityAlert = (id, data) => {
  return instance.put(`/admin/security/alerts/${id}`, data);
};

// Settings
export const getSettings = () => {
  return instance.get('/admin/settings');
};

export const updateSettings = (data) => {
  return instance.put('/admin/settings', data);
};

// Dashboard
export const getDashboard = () => {
  return instance.get('/admin/dashboard');
};

export const getRecentActivities = () => {
  return instance.get('/admin/activities/recent');
};
