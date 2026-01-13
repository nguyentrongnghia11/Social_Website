

import axios from 'axios'
import { instance } from '../config'
const BASE_URL = 'http://localhost:3000/api/'

// Map sortBy values từ frontend format sang backend format
const mapSortBy = (sortBy) => {
    const sortMap = {
        '-createdAt': 'latest',
        'createdAt': 'earliest',
        '-likeCount': 'likes',
        '-commentCount': 'comments'
    }
    return sortMap[sortBy] || 'latest';
}

const getALlPosts = async (query) => {
    const params = {
        ...query,
        sortBy: query.sortBy ? mapSortBy(query.sortBy) : 'latest'
    }
    const data = await instance.get(`/post/all?` + new URLSearchParams(params))
    return data.data;
}

const getTopPosts = async (limit = 5) => {
    try {
        const data = await instance.get(`/post/top?limit=${limit}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching top posts:', error);
        return { result: [] };
    }
}

const searchPosts = async (query) => {
    const params = {
        q: query.q || query.search,
        page: query.page || 1,
        limit: query.limit || 10,
        sortBy: query.sortBy ? mapSortBy(query.sortBy) : 'latest'
    }
    
    const data = await instance.get(`/post/search?` + new URLSearchParams(params))
    return data.data;
}

const getPost = async (params) => {
    const data = await instance.get(`post/${params}`)
    return data.data;
}

const getComments = async (params) => {
    const data = await instance.get(`/comment/${params}`)
    return data.data;
}

const createComment = async (formData, params) => {
    const data = await instance.post(`/comment/${params}/create`, formData)
    return data.data;
}

const likePost = async (postID) => {
    const data = await instance.patch(`/post/react`, { postID })
    return data.data;
}

const createPost = async (formData) => {
    const data = await instance.post('post/create', formData)
    return data.data;
}

const grantPermissionUpload = async (formData) => {
    const res = await instance.post(`/post/grant-permission`, formData, {
        withCredentials: true
    })

    return res.data
}

const postFile = async (formData, cloud_name) => {
    try {
        console.log(formData, cloud_name)
        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" }
            }
        );
        return res.data;
    } catch (err) {
        console.error("Upload error:", err.response?.data || err.message);
        throw err;
    }
};

const saveMedia = async (listFile, postId) => {
    try {
        console.log("day la list file ", listFile)
        console.log (postId)
        const res = await instance.post(`/post/save/media`, { postId, listFile });
        console.log("day la res post ", res)
        return res.data;
    } catch (err) {
        console.error("Upload error:", err.response?.data || err.message);
        throw err;
    }
};

const updateComment = async (commentId, user, data) => {
    const res = await instance.patch(`/comment/${commentId}`, data);
    return res.data;
};

const deleteComment = async (commentId, user) => {
    const res = await instance.delete(`/comment/${commentId}`);
    return res.data;
};

const getUserLikes = async (postId, query) => {
    const res = await instance.get(`/post/${postId}/likes?` + new URLSearchParams(query));
    return res.data;
};

const deletePost = async (postId, user) => {
    const res = await instance.delete(`/post/${postId}`);
    return res.data;
};

const updatePost = async (postId, user, data) => {
    console.log  ('Updating post:', postId, data);
    const res = await instance.patch(`/post/${postId}`, data);
    return res.data;
};


export {
    getALlPosts,
    getTopPosts,
    searchPosts,
    getPost,
    getComments,
    createComment,
    likePost,
    createPost,
    grantPermissionUpload,
    postFile,
    saveMedia,
    updateComment,
    deleteComment,
    getUserLikes,
    deletePost,
    updatePost
}