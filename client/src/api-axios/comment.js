import { instance } from '../config';

// Upload comment image to S3
export const uploadCommentImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return instance.post('/comment/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
