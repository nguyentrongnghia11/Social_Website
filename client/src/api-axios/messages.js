import { instance } from "../config"

const getMessageOfUser = async (conversationId, params = {}) => {
    const { page = 1, limit = 50 } = params;
    const response = await instance.get(`/conversations/${conversationId}`, {
        params: { page, limit }
    });

    console.log("API Response:", response.data);
    return response.data;
}

const sendMessage = async (conversationId, messageData) => {
    const response = await instance.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data;
}

const getUploadSignature = async (conversationId, fileCount, fileType = 'image') => {
    const response = await instance.post('/conversations/grant-permission', {
        conversationId,
        fileCount,
        fileType
    });
    return response.data;
}

const getTotalUnreadCount = async () => {
    const response = await instance.get('/conversations/unread-count');
    return response.data;
}

const uploadToS3 = async (file, presignedData) => {
    console.log("Uploading file to S3 with presigned URL:", presignedData);
    
    const response = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    });

    if (!response.ok) {
        throw new Error('S3 upload failed');
    }

    // Return file info
    return {
        url: presignedData.uploadUrl.split('?')[0], // Remove query params to get actual URL
        key: presignedData.key,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        size: file.size,
        filename: file.name
    };
}

export { getMessageOfUser, sendMessage, getUploadSignature, uploadToS3, getTotalUnreadCount }