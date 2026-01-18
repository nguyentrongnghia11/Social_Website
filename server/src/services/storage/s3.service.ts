import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { s3Client, BUCKET_NAME } from '../../databases/s3';

export interface S3UploadResult {
    url: string;
    key: string;
    bucket: string;
    etag?: string;
    location: string;
}

export interface S3FileInfo {
    key: string;
    size: number;
    lastModified?: Date;
    contentType?: string;
}


export class S3Service {
    static async uploadFile(
        fileBuffer: Buffer | Readable | string | Uint8Array,
        key: string,
        contentType: string,
        folder: string = 'upload'
    ): Promise<S3UploadResult> {
        const fullKey = folder ? `${folder}/${key}` : key;

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: fullKey,
                Body: fileBuffer,
                ContentType: contentType,
            }
        });

        const result = await upload.done();

        const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fullKey}`;

        return {
            url,
            key: fullKey,
            bucket: BUCKET_NAME,
            etag: result.ETag,
            location: result.Location || url
        };
    }

    static async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
    }

    static async getFileInfo(key: string): Promise<S3FileInfo> {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const result = await s3Client.send(command);

        return {
            key,
            size: result.ContentLength || 0,
            lastModified: result.LastModified,
            contentType: result.ContentType
        };
    }

    static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        return await getSignedUrl(s3Client, command, { expiresIn });
    }

    static async getPresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn: number = 3600
    ): Promise<{ url: string; key: string; fields: Record<string, string> }> {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const url = await getSignedUrl(s3Client, command, {
            expiresIn
        });
        return {
            url,
            key,
            fields: {
                'Content-Type': contentType
            }
        };
    }
}

export const uploadToS3 = S3Service.uploadFile;
export const deleteFromS3 = S3Service.deleteFile;
export const getS3FileInfo = S3Service.getFileInfo;
export const getSignedS3Url = S3Service.getSignedUrl;
export const getPresignedUploadUrl = S3Service.getPresignedUploadUrl;
