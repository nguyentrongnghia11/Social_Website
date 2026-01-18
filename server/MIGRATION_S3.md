# Migration từ Cloudinary sang AWS S3

## Tổng quan

Dự án đã được chuyển đổi từ sử dụng Cloudinary sang AWS S3 để lưu trữ và quản lý file (hình ảnh, video, v.v.).

## Những thay đổi chính

### 1. File mới được tạo

- **`src/databases/s3.ts`**: Service wrapper cho AWS S3, cung cấp các chức năng:
  - `uploadToS3()`: Upload file lên S3
  - `deleteFromS3()`: Xóa file từ S3
  - `getS3FileInfo()`: Lấy thông tin metadata của file
  - `getSignedS3Url()`: Tạo signed URL cho truy cập tạm thời
  - `getPresignedUploadUrl()`: Tạo presigned URL để client upload trực tiếp

### 2. File được cập nhật

#### `src/services/upload/uploadImage.ts`
- Thay thế Cloudinary upload bằng S3 upload
- Tự động detect content type và resource type
- Sử dụng UUID để tạo unique filename

#### `src/services/post/post.services.ts`
- `grantPermissionUploadFile()`: Thay signature Cloudinary bằng S3 presigned URL
- `grantPermissionForUpdatePost()`: Cập nhật để sử dụng S3
- `updateFile()`: Hỗ trợ lưu metadata S3 (key thay vì public_id)
- `updatePost()`: Xử lý cả S3 objects và Cloudinary objects (backward compatible)

#### `src/services/message/message.services.ts`
- `sendMessageWithMedia()`: Upload file message lên S3
- `grantPermissionUploadMedia()`: Tạo presigned URLs cho client upload

#### `src/validations/schema.validations.ts`
- Cập nhật comment từ "Cloudinary objects" thành "S3/Cloudinary objects"

### 3. Package mới

```json
{
  "@aws-sdk/client-s3": "^3.970.0",
  "@aws-sdk/lib-storage": "^3.970.0",
  "@aws-sdk/s3-request-presigner": "^3.x.x",
  "uuid": "^x.x.x",
  "@types/uuid": "^x.x.x"
}
```

## Cấu hình Environment Variables

### Cấu hình AWS S3 (MỚI - BẮT BUỘC)

Thêm các biến sau vào file `.env`:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1                      # Region của S3 bucket
AWS_ACCESS_KEY_ID=your_access_key_id      # AWS Access Key
AWS_SECRET_ACCESS_KEY=your_secret_key     # AWS Secret Key
AWS_S3_BUCKET_NAME=your_bucket_name       # Tên S3 bucket
```

### Cấu hình Cloudinary (CŨ - CÓ THỂ XÓA)

Các biến này có thể được xóa sau khi migration hoàn tất:

```env
# CLOUND_NAME=your_cloudinary_cloud_name
# API_KEY=your_cloudinary_api_key
# API_SECRET=your_cloudinary_api_secret
```

## Hướng dẫn thiết lập AWS S3

### 1. Tạo S3 Bucket

```bash
# Sử dụng AWS CLI
aws s3 mb s3://your-bucket-name --region us-east-1
```

Hoặc tạo qua AWS Console:
1. Đăng nhập vào AWS Console
2. Vào S3 service
3. Nhấn "Create bucket"
4. Chọn region và đặt tên bucket
5. Cấu hình permissions phù hợp

### 2. Cấu hình CORS cho S3 Bucket

Nếu cần upload từ browser, thêm CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Cấu hình IAM User và Permissions

Tạo IAM user với policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

### 4. Cấu hình Public Access (Tùy chọn)

Nếu muốn file có thể truy cập công khai:

1. Vào S3 Bucket Settings
2. Bỏ chọn "Block all public access"
3. Thêm Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Cách thức hoạt động

### Upload Flow (Server-side)

1. Client gửi file đến server
2. Server nhận file qua multer (lưu tạm thời)
3. Server đọc file buffer và upload lên S3
4. S3 trả về URL và key
5. Server lưu thông tin vào database
6. Server xóa file tạm

### Upload Flow (Client-side với Presigned URL)

1. Client yêu cầu presigned URL từ server
2. Server tạo presigned URL (valid trong 1 giờ)
3. Client upload trực tiếp lên S3 qua presigned URL
4. Client thông báo server về upload thành công
5. Server lưu metadata vào database

## Cấu trúc File trên S3

```
your-bucket-name/
├── upload/              # File posts thông thường
│   ├── {postId}/
│   │   └── {uuid}.{ext}
├── avatar/              # Avatar users
│   ├── {postId}/
│   │   └── {uuid}.{ext}
└── messages/            # File trong messages
    ├── {conversationId}/
    │   └── {uuid}.{ext}
```

## Migration Data từ Cloudinary sang S3

Nếu bạn có data cũ trên Cloudinary và muốn migrate:

### Script Migration (Tham khảo)

```typescript
import { downloadFromCloudinary } from './cloudinary-helper';
import { uploadToS3 } from './databases/s3';
import _File from './models/file';

async function migrateFiles() {
  // Lấy tất cả files từ database
  const files = await _File.find({ public_id: { $exists: true } });
  
  for (const file of files) {
    try {
      // Download từ Cloudinary
      const buffer = await downloadFromCloudinary(file.secure_url);
      
      // Upload lên S3
      const s3Result = await uploadToS3(
        buffer,
        `migrated/${file.public_id}`,
        file.resource_type || 'image',
        'migration'
      );
      
      // Cập nhật database
      await _File.updateOne(
        { _id: file._id },
        {
          $set: {
            secure_url: s3Result.url,
            public_id: s3Result.key, // Lưu S3 key
            migrated: true
          }
        }
      );
      
      console.log(`Migrated: ${file.public_id}`);
    } catch (error) {
      console.error(`Failed to migrate ${file.public_id}:`, error);
    }
  }
}
```

## Testing

### Test Upload

```bash
# Test upload file
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Post" \
  -F "content=Test Content" \
  -F "files=@/path/to/image.jpg"
```

### Test Presigned URL

```bash
# Lấy presigned URL
curl -X POST http://localhost:5000/api/posts/upload-permission \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"typeImg":"upload","title":"Test","content":"Test"}'

# Upload file trực tiếp lên S3 bằng presigned URL (response từ trên)
curl -X PUT "PRESIGNED_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/image.jpg"
```

## Troubleshooting

### Lỗi: AWS credentials not found

**Nguyên nhân**: Chưa cấu hình AWS credentials

**Giải pháp**: 
- Kiểm tra file `.env` có đầy đủ `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`
- Hoặc cấu hình AWS CLI: `aws configure`

### Lỗi: Access Denied

**Nguyên nhân**: IAM user không có quyền truy cập S3 bucket

**Giải pháp**: 
- Kiểm tra IAM policy
- Đảm bảo bucket name đúng
- Kiểm tra region

### Lỗi: Presigned URL expired

**Nguyên nhân**: Client upload sau khi URL hết hạn (mặc định 1 giờ)

**Giải pháp**: 
- Yêu cầu presigned URL mới
- Tăng expiration time nếu cần

### File không hiển thị (403 Forbidden)

**Nguyên nhân**: Bucket không public hoặc thiếu CORS

**Giải pháp**: 
- Cấu hình bucket policy cho public access
- Thêm CORS configuration
- Hoặc sử dụng signed URLs để truy cập

## Backward Compatibility

Code hiện tại vẫn **tương thích ngược** với Cloudinary objects trong database. Các field sau được xử lý:

- `public_id` → có thể là Cloudinary public_id hoặc S3 key
- `secure_url` → có thể là Cloudinary URL hoặc S3 URL
- `cloudinaryId` → được sử dụng để lưu S3 key cho compatibility

## Next Steps

1. ✅ Cài đặt dependencies: `npm install`
2. ✅ Cấu hình AWS credentials trong `.env`
3. ✅ Tạo S3 bucket và cấu hình permissions
4. ⚠️ Test các chức năng upload/download
5. ⚠️ (Tùy chọn) Migrate data cũ từ Cloudinary
6. ⚠️ Remove Cloudinary package khi hoàn tất: `npm uninstall cloudinary`

## Support

Nếu gặp vấn đề, kiểm tra:
- AWS credentials có đúng không
- S3 bucket có tồn tại và có quyền truy cập không  
- Region có khớp không
- IAM permissions có đầy đủ không

## Chi phí

Lưu ý về chi phí AWS S3:
- Storage: ~$0.023/GB/tháng (Standard tier)
- PUT/COPY/POST requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests
- Data transfer OUT: $0.09/GB (sau 1GB free mỗi tháng)

Tham khảo: [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
