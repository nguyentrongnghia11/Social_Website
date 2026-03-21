# JustVibing — Backend Server

> **Node.js / TypeScript RESTful API & Real-time Server** for the JustVibing social platform.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [API Routes](#api-routes)
6. [Real-time Events (Socket.IO)](#real-time-events-socketio)
7. [Background Workers](#background-workers)
8. [Environment Variables](#environment-variables)
9. [Getting Started](#getting-started)
10. [Docker](#docker)

---

## Overview

The backend is the core API server for JustVibing — a feature-rich social network supporting posts, comments, real-time messaging, voice/video calling (WebRTC), push notifications, AI-powered content moderation & post recommendation, and cloud media storage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                      │
└─────────────┬───────────────────────────┬───────────────┘
              │ HTTP (REST)               │ WebSocket (Socket.IO)
              ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Server (TypeScript)             │
│  ┌────────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ REST Routes│  │ Passport │  │  Socket.IO Service  │  │
│  │ (Auth, Post│  │ JWT Auth │  │  (Chat, WebRTC,     │  │
│  │  User, etc)│  │  OAuth2  │  │   Notifications)    │  │
│  └────────────┘  └──────────┘  └────────────────────┘   │ 
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐
│ MongoDB  │  │   Redis    │  │  RabbitMQ    │
│(Mongoose)│  │(Cache/PubSub│  │ (MQ Broking) │
└──────────┘  └────────────┘  └──────┬───────┘
                                      │
                              ┌───────▼──────┐
                              │ AI Services  │
                              │  (Python/    │
                              │   FastAPI)   │
                              └──────────────┘
┌──────────────────────────────────────────────┐
│           Cloud Storage                      │
│  ┌────────────┐  ┌────────────┐  ┌────────┐  │
│  │  AWS S3    │  │ Cloudinary │  │ Firebase│  │
│  └────────────┘  └────────────┘  └────────┘  │
└──────────────────────────────────────────────┘
```

---

## Tech Stack

### Core Framework

| Công nghệ | Phiên bản | Ứng dụng |
|-----------|-----------|----------|
| **Node.js** | ≥18 | Runtime môi trường thực thi server-side JS/TS |
| **TypeScript** | ^5.9 | Kiểm tra kiểu tĩnh, tăng khả năng bảo trì & phát hiện lỗi sớm tại compile-time |
| **Express.js** | ^4.21 | Web framework xử lý HTTP request, routing, middleware pipeline |

---

### Database & Caching

| Công nghệ | Ứng dụng |
|-----------|----------|
| **MongoDB** (qua `mongoose` ^8.9) | Database chính lưu trữ toàn bộ dữ liệu ứng dụng: User, Post, Comment, Message, Conversation, Group, Notification, Call. Sử dụng `mongoose-delete` để soft-delete. |
| **Redis** (qua `redis` ^5.6 & `@socket.io/redis-adapter`) | **Đa mục đích:** (1) Pub/Sub adapter cho Socket.IO — đồng bộ event giữa nhiều process; (2) Lưu trạng thái online của user theo socket ID (Set); (3) Cache số tin nhắn chưa đọc theo conversation; (4) Session store cho OAuth2 |

---

### Message Queue

| Công nghệ | Ứng dụng |
|-----------|----------|
| **RabbitMQ** (qua `amqplib` ^0.10) | Message broker bất đồng bộ. Dùng để giao tiếp giữa Node.js server và Python AI Services: (1) Queue `toxic-detection` — gửi nội dung post lên AI để kiểm duyệt độc hại; (2) Queue `encode-post` — gửi văn bản post để AI tạo vector embedding phục vụ tìm bài viết tương tự |

---

### Real-time Communication

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Socket.IO** ^4.8 | WebSocket server xử lý tất cả sự kiện real-time: nhắn tin, typing indicator, tạo cuộc trò chuyện/nhóm, signaling WebRTC (call-offer, call-answer, ICE candidate), và trạng thái online/offline |
| **WebRTC (Signaling)** | Socket.IO đóng vai trò signaling server cho WebRTC — chuyển tiếp SDP Offer/Answer và ICE Candidate giữa 2 peer để thiết lập kết nối P2P voice/video call |

---

### Authentication & Authorization

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Passport.js** + `passport-jwt` ^4.0 | Strategy xác thực bằng JWT Bearer Token cho tất cả route bảo vệ |
| **passport-oauth2** + `googleapis` | Đăng nhập bằng Google OAuth2. Server lấy access token, lấy thông tin user từ Google API, tạo/tìm user trong DB, rồi cấp JWT nội bộ |
| **jsonwebtoken** ^9.0 | Ký và xác minh JWT (Access Token + Refresh Token) |
| **bcrypt** ^5.1 | Hash mật khẩu người dùng trước khi lưu vào DB |
| **express-session** + `connect-redis` | Lưu OAuth2 session trong Redis (thay vì memory) để hỗ trợ scale horizontal |

---

### Security & Rate Limiting

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Helmet** ^8.0 | Tự động set các HTTP security header (CSP, X-Content-Type, HSTS, ...) |
| **cors** ^2.8 | Cấu hình Cross-Origin Resource Sharing, chỉ cho phép origin hợp lệ |
| **express-rate-limit** ^8.1 | Giới hạn số request trong khoảng thời gian — chống brute-force và DDoS |
| **express-slow-down** ^3.0 | Làm chậm dần response khi request vượt ngưỡng — giảm nhẹ hơn so với block cứng |

---

### Cloud Storage & Media

| Công nghệ | Ứng dụng |
|-----------|----------|
| **AWS S3** (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner`) | Lưu trữ file media (ảnh, video, tài liệu) của người dùng. Tạo presigned URL để upload trực tiếp từ client lên S3 mà không qua server |
| **Cloudinary** ^2.5 | Upload và transform ảnh (resize, crop, tối ưu format). Dùng như alternative/backup CDN cho media |
| **Multer** ^2.0 | Middleware xử lý `multipart/form-data` để nhận file upload từ client trước khi đẩy lên cloud |

---

### Push Notifications

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Firebase Admin SDK** ^13.4 | Gửi push notification đến thiết bị người dùng (iOS/Android/Web) thông qua FCM khi: nhận tin nhắn mới, có cuộc gọi đến, hoặc khi offline |
| **firebase** (client config) | Cấu hình Firebase project cho server |

---

### Email / OTP

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Nodemailer** ^6.10 | Gửi email xác thực tài khoản và email OTP cho luồng quên mật khẩu |
| **otp-generator** ^4.0 | Tạo mã OTP ngẫu nhiên (số/chữ/ký tự đặc biệt có cấu hình) |
| **node-cron** ^4.2 | Lên lịch job định kỳ: xóa OTP hết hạn, dọn dẹp data tạm thời |

---

### AI Integration

| Công nghệ | Ứng dụng |
|-----------|----------|
| **@google/generative-ai** ^0.24 | Gọi Gemini API để sinh nội dung thông minh (caption gợi ý, tóm tắt post, ...) |
| **@huggingface/inference** ^4.13 | Gọi Hugging Face Inference API để chạy NLP model (phân tích cảm xúc, phân loại nội dung) mà không cần host model |
| **RabbitMQ ↔ Python AI Services** | Giao tiếp async với AI Services riêng biệt (Python/FastAPI) qua 2 queue: `toxic-detection` (kiểm duyệt nội dung) và `encode-post` (tạo embedding để tìm bài tương tự) |

---

### Validation

| Công nghệ | Ứng dụng |
|-----------|----------|
| **Joi** ^18.0 | Schema validation cho request body — đảm bảo dữ liệu đầu vào hợp lệ trước khi vào controller |

---

### Developer Tools

| Công nghệ | Ứng dụng |
|-----------|----------|
| **ts-node** + **nodemon** | Hot-reload TypeScript trong development |
| **dotenv** ^16.4 | Load biến môi trường từ file `.env` |
| **uuid** ^13.0 | Sinh ID duy nhất (dùng cho tên file upload, correlation ID) |
| **axios** ^1.7 | HTTP client để gọi external API |
| **http-status-codes** ^2.3 | Enum các HTTP status code chuẩn, tránh dùng magic number |

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                # Entrypoint: khởi tạo Express, Socket.IO, kết nối DB
│   ├── routes/                 # Định nghĩa các API route
│   │   ├── server.ts           # Route aggregator
│   │   ├── auth.ts             # /api/auth/*
│   │   ├── post.ts             # /api/posts/*
│   │   ├── comment.ts          # /api/comments/*
│   │   ├── conversations.ts    # /api/conversations/*
│   │   ├── notification.ts     # /api/notifications/*
│   │   ├── call.ts             # /api/calls/*
│   │   ├── admin.ts            # /api/admin/*
│   │   └── ...
│   ├── controller/             # Xử lý business logic cho mỗi route
│   ├── services/               # Service layer (tái sử dụng logic)
│   │   ├── socketIO.services.ts  # Toàn bộ Socket.IO event handlers
│   │   ├── auth/               # OAuth2, JWT service
│   │   ├── ai/                 # Giao tiếp với AI (Gemini, HuggingFace, RabbitMQ)
│   │   ├── notification/       # Push notification (FCM)
│   │   ├── call/               # Logic call (initiate, accept, reject, end)
│   │   ├── post/               # Post service
│   │   ├── message/            # Message service
│   │   └── storage/            # Cloud storage (S3, Cloudinary)
│   ├── models/                 # Mongoose schema & model
│   ├── databases/              # Kết nối DB/service
│   │   ├── connectMongo.ts     # MongoDB connection
│   │   ├── connectRedis.ts     # Redis client
│   │   ├── connectRabbitmq.ts  # RabbitMQ connection
│   │   ├── connectFirebase.ts  # Firebase Admin init
│   │   ├── s3.ts               # AWS S3 client
│   │   └── cloud.ts            # Cloudinary config
│   ├── middleware/             # Express middleware
│   │   ├── verifyToken.ts      # Passport JWT strategy
│   │   ├── authSocket.ts       # Socket.IO JWT auth middleware
│   │   ├── checkPermission.ts  # Role-based permission check
│   │   ├── checkRatelimt.ts    # Rate limit config
│   │   ├── auditLog.ts         # Ghi log thao tác admin
│   │   └── handleError.ts      # Global error handler
│   ├── validations/            # Joi validation schema
│   ├── utils/                  # Tiện ích (cors config, helper functions)
│   ├── enums/                  # TypeScript enum dùng chung
│   └── types/                  # TypeScript type/interface dùng chung
├── workers/                    # Background worker processes
│   ├── upload.woker.ts         # Worker xử lý upload media lên cloud
│   ├── sendOtp.worker.ts       # Worker gửi OTP email
│   ├── detectToxic.worker.ts   # Worker nhận kết quả kiểm duyệt từ RabbitMQ
│   ├── encodePost.worker.ts    # Worker nhận kết quả embedding post từ RabbitMQ
│   └── startWorker.ts          # Khởi động tất cả worker
├── dockerfile
├── nodemon.json
├── tsconfig.json
└── package.json
```

---

## API Routes

| Prefix | Mô tả |
|--------|-------|
| `POST /api/auth/register` | Đăng ký tài khoản |
| `POST /api/auth/login` | Đăng nhập, nhận JWT |
| `GET  /api/auth/google` | Bắt đầu luồng Google OAuth2 |
| `POST /api/auth/otp/send` | Gửi OTP qua email |
| `POST /api/auth/otp/verify` | Xác minh OTP, đặt lại mật khẩu |
| `GET  /api/posts` | Lấy danh sách post (feed) |
| `POST /api/posts` | Tạo post mới |
| `GET  /api/posts/top` | Lấy top posts |
| `GET  /api/posts/:id/similar` | Lấy bài viết tương tự (AI) |
| `GET  /api/comments` | Lấy comment của post |
| `POST /api/comments` | Tạo comment |
| `GET  /api/conversations` | Lấy danh sách cuộc trò chuyện |
| `GET  /api/notifications` | Lấy thông báo |
| `GET  /api/calls` | Lịch sử cuộc gọi |
| `GET  /api/admin/*` | Quản trị (yêu cầu role Admin) |

---

## Real-time Events (Socket.IO)

Socket.IO được xác thực bằng JWT middleware (`authSocket`) trước khi kết nối.

### Messaging
| Event (client → server) | Mô tả |
|--------------------------|-------|
| `join-conversation` | Tham gia room của cuộc trò chuyện |
| `chat` | Gửi tin nhắn (text, ảnh, video, file) |
| `typing` | Thông báo đang nhập |

### Voice/Video Call (WebRTC Signaling)
| Event | Mô tả |
|-------|-------|
| `call-initiate` | Bắt đầu cuộc gọi, tạo record trong DB |
| `call-offer` | Chuyển tiếp SDP Offer từ caller đến receiver |
| `call-answer` | Chuyển tiếp SDP Answer từ receiver đến caller |
| `call-ice-candidate` | Chuyển tiếp ICE Candidate giữa 2 peer |
| `call-reject` | Từ chối cuộc gọi |
| `call-end` | Kết thúc cuộc gọi, tính thời lượng |

---

## Background Workers

| Worker | Công nghệ | Chức năng |
|--------|-----------|-----------|
| `upload.worker` | AWS S3 / Cloudinary | Nhận job upload file từ queue nội bộ, đẩy lên cloud, trả URL về |
| `sendOtp.worker` | Nodemailer | Nhận job gửi email OTP, gửi bất đồng bộ tránh blocking request |
| `detectToxic.worker` | RabbitMQ consumer | Lắng nghe kết quả kiểm duyệt từ Python AI Services, cập nhật trạng thái post |
| `encodePost.worker` | RabbitMQ consumer | Lắng nghe vector embedding từ AI Services, lưu vào MongoDB cho tính năng similar posts |

---

## Environment Variables

Tạo file `.env` từ template `.env.docker`:

```env
# Server
PORT=8000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://...

# Redis
REDIS_URI=redis://localhost:6379

# RabbitMQ
RABBITMQ_URI=amqp://admin:strongpassword123@localhost:5672

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Firebase Admin
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (Nodemailer)
EMAIL_USER=...
EMAIL_PASS=...

# AI
GEMINI_API_KEY=...
HUGGINGFACE_TOKEN=...
```

---

## Getting Started

### Yêu cầu
- Node.js ≥ 18
- MongoDB (Atlas hoặc local)
- Redis
- RabbitMQ

### Cài đặt

```bash
cd server
npm install
```

### Chạy development

```bash
npm run dev
```

Server khởi động ở `http://localhost:8000`

### Build production

```bash
npm run build
```

---

## Docker

Toàn bộ backend được đóng gói bằng Docker và orchestrate bởi `docker-compose.yml` ở thư mục gốc.

```yaml
# Services được quản lý bởi docker-compose:
# - social_server    → Node.js API server (port 3000)
# - social_frontend  → React client (port 8080)
# - social_redis     → Redis alpine (port 6379)
# - social_rabbitmq  → RabbitMQ 3.13 với Management UI (port 5672 & 15672)
```

```bash
# Chạy toàn bộ stack
docker-compose up -d

# Xem logs server
docker-compose logs -f server
```

> RabbitMQ Management UI: http://localhost:15672 (admin / strongpassword123)

---

## AI Services (Python)

Thư mục `../AI_Services/` chứa microservice Python độc lập:

| Công nghệ | Ứng dụng |
|-----------|----------|
| **FastAPI** | HTTP server & health check endpoint |
| **aio-pika** | Async RabbitMQ consumer (Python) |
| **sentence-transformers** ^2.3 | Tạo vector embedding từ nội dung bài viết để tính độ tương đồng |
| **PyTorch** ≥2.5 | Backend tensor computation cho sentence-transformers |
| **Motor** ^3.3 | Async MongoDB driver (Python) — lưu embedding vectors |
| **python-dotenv** | Quản lý biến môi trường |

AI Services giao tiếp với Node.js server **thuần qua RabbitMQ**, không expose HTTP API ra ngoài (stateless, scalable).