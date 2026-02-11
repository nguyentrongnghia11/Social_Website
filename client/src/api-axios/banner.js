import axios from 'axios';
import { instance } from '../config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Upload banner image to S3
export const uploadBannerImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);


    return instance.post(`/admin/banners/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Get all banners
export const getBanners = async (params) => {
    return instance.get(`/admin/banners`, { params });
};

// Create new banner
export const createBanner = async (data) => {
    return instance.post(`/admin/banners`, data);
};

// Update banner
export const updateBanner = async (id, data) => {
    return instance.put(`/admin/banners/${id}`, data);
};

// Delete banner
export const deleteBanner = async (id) => {
    return instance.delete(`/admin/banners/${id}`);
};

// Toggle banner active status
export const toggleBanner = async (id) => {
    return instance.put(`/admin/banners/${id}/toggle`);
};

// Get active banners for public display
export const getActiveBanners = async (position) => {
    return instance.get(`/banners`, { params: { position } });
};
