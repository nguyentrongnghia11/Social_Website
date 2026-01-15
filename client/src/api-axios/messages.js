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

const uploadToCloudinary = async (file, signature) => {

    console.log ("Uploading file with signature:", signature);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', signature.folder);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('api_key', signature.apiKey);

    // Xác định endpoint dựa trên fileType từ backend
    let uploadType = 'auto';
    if (signature.fileType === 'image') uploadType = 'image';
    else if (signature.fileType === 'video') uploadType = 'video';
    else if (signature.fileType === 'audio') uploadType = 'video'; // audio dùng video endpoint
    else if (signature.fileType === 'document') uploadType = 'raw';

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`,
        {
            method: 'POST',
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    return await response.json();
}

export { getMessageOfUser, sendMessage, getUploadSignature, uploadToCloudinary, getTotalUnreadCount }