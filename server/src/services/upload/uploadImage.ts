import { S3Service } from '../storage/s3.service'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const uploadImage = async (paths: string[]) => {
    try {
        const result = await Promise.all(
            paths.map(async (filePath) => {
                console.log('path', filePath)
                
                const fileBuffer = fs.readFileSync(filePath);
                const fileName = path.basename(filePath);
                const ext = path.extname(fileName);
                
                const uniqueFileName = `${uuidv4()}${ext}`;
                
                let contentType = 'application/octet-stream';
                if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    contentType = `image/${ext.substring(1).toLowerCase()}`;
                } else if (ext.match(/\.(mp4|webm|ogg)$/i)) {
                    contentType = `video/${ext.substring(1).toLowerCase()}`;
                } else if (ext.match(/\.(mp3|wav)$/i)) {
                    contentType = `audio/${ext.substring(1).toLowerCase()}`;
                }
                
                let resourceType = 'file';
                if (contentType.startsWith('image/')) {
                    resourceType = 'image';
                } else if (contentType.startsWith('video/')) {
                    resourceType = 'video';
                } else if (contentType.startsWith('audio/')) {
                    resourceType = 'audio';
                }
                
                // Upload to S3
                const data = await S3Service.uploadFile(fileBuffer, uniqueFileName, contentType, 'upload');

                console.log(data)
                return { urlPre: data.url, type: resourceType, key: data.key };
            })
        );

        for (let i = 0; i < result.length; i++) {
            fs.unlinkSync(paths[i])
        }

        return result;
    } catch (error) {
        console.error("Upload failed:", error)
        throw error;
    }
};

const getAssetInfo = async (key: string) => {
    try {
        const result = await S3Service.getFileInfo(key);
        console.log(result);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export { uploadImage, getAssetInfo };
