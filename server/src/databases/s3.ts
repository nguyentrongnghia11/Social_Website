import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';

/**
 * AWS S3 Client Configuration
 * Exports S3 client and bucket configuration for use in storage services
 */

// Initialize S3 client
export const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    // Disable automatic checksum calculation for uploads
    requestChecksumCalculation: 'WHEN_REQUIRED'
});

// S3 Bucket name from environment
export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export default s3Client;
