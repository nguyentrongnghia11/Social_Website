import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';


// export const s3Client = new S3Client({
//     region: process.env.AWS_REGION || 'us-east-1',
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
//     },
//     requestChecksumCalculation: 'WHEN_REQUIRED'
// });

const s3Config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    requestChecksumCalculation: 'WHEN_REQUIRED'
};

console.log("ENV AWS:", {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_REGION: process.env.AWS_REGION,
});

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {

    console.log ("co chay vao day khong")
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

export const s3Client = new S3Client(s3Config);

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

// export default s3Client;
