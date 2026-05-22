# Social Website Platform
**Full-stack Developer (Personal Project)**

## 📅 Timeline
Started: 2026 | Deployment: AWS

---

## 🎯 Project Overview

A comprehensive full-stack social media platform with AI-powered content analysis, real-time messaging, and admin management capabilities. The application combines modern web technologies with machine learning for content moderation and intelligent recommendations.

---

## 🔧 Key Responsibilities & Technical Achievements

### 1. **Real-time Communication System**
- Implemented Socket.io for instant messaging, notifications, and live updates
- Built Redis-backed session management for scalable real-time connections
- Developed message queue system using RabbitMQ for asynchronous task processing
- Automatic session cleanup and message expiration for resource optimization

### 2. **Authentication & Security**
- Implemented JWT token-based authentication with Passport.js strategy
- Built role-based access control (RBAC) for user, moderator, and admin roles
- Integrated ratelimiting and request throttling to prevent abuse
- Added refresh token mechanism with token versioning support
- Session management with Redis and HTTP-only cookies

### 3. **AI-Powered Content Analysis**
- Integrated PyTorch-based toxic comment detection using transformers
- Implemented post encoding service for semantic search and recommendations
- Built hint/suggestion engine using sentence-transformers for content relevance
- Configured N8N workflows for automated AI data processing and analysis
- Asynchronous worker processes for batch processing without blocking main thread

### 4. **Social Features & User Engagement**
- Developed post creation, editing, deletion with real-time feed updates
- Implemented comment system with nested replies and comment threading
- Built like/favorite system with real-time counter synchronization
- Created follow/unfollow system with follower/following lists
- Notification system for likes, comments, follows, and messages

### 5. **Admin Dashboard & Analytics**
- Built comprehensive admin dashboard with user management capabilities
- Implemented admin analytics with charts (customer analytics, engagement metrics)
- Created admin moderation tools for post and user management
- Added security monitoring and admin settings management
- User role management and permission configuration interface

### 6. **Cloud Integration & Storage**
- Integrated AWS S3 for scalable image and file storage
- Implemented presigned URLs for secure file uploads and downloads
- Added Cloudinary integration for image optimization
- Firebase integration for push notifications and real-time database support
- AWS SDK integration for S3 bucket operations and storage management

### 7. **Performance Optimization**
- Implemented multi-layer caching strategy using Redis
- Pagination and lazy loading for feed optimization
- Async/await patterns for non-blocking operations
- Worker processes for background job execution (uploads, encoding, notifications)
- Database indexing and query optimization for MongoDB

### 8. **Frontend Architecture**
- Built modern UI with React 18 and Material-UI components
- Implemented state management with Zustand for simplicity and performance
- Created responsive design with mobile profile optimization
- Integrated rich text editor (Quill) for post composition
- Built advanced components: image lightbox, markdown renderer, HTML content display

### 9. **DevOps & Containerization**
- Containerized all services using Docker and Docker Compose
- Configured Nginx reverse proxy for load balancing and routing
- Infrastructure setup for AWS VPC deployment
- Multi-service orchestration with proper networking configuration
- Environment-based configuration management

### 10. **Data Processing & Queues**
- Implemented batch processing pipeline for AI model operations
- RabbitMQ consumer setup for distributed task processing
- Worker services for:
  - Post encoding and semantic indexing
  - Toxic content detection
  - File upload processing
  - OTP sending
  - Like synchronization

---

## 🛠️ Tech Stack

### **Frontend**
- React 18 | Vite | Material-UI (MUI 7)
- Zustand (State Management) | React Router 6
- Socket.io-Client | Axios
- React Quill (Rich Text) | React Markdown
- Recharts (Data Visualization)

### **Backend**
- Node.js | TypeScript | Express.js
- Passport.js (Authentication)
- Socket.io | Redis | RabbitMQ (amqplib)
- Firebase | Cloudinary | AWS S3 SDK
- Rate Limiting & Express Middleware

### **AI/ML Services**
- Python 3 | FastAPI | Uvicorn
- PyTorch | Transformers | Sentence-Transformers
- Motor (Async MongoDB)
- Aio-pika (Async RabbitMQ)

### **Databases**
- MongoDB (Document Storage)
- Redis (Caching & Sessions)
- RabbitMQ (Message Queue)

### **DevOps & Cloud**
- Docker | Docker Compose
- Nginx (Reverse Proxy)
- AWS (VPC, S3, Deployment)
- AWS SDK for Node.js

---

## 📊 Database Architecture

- **MongoDB**: User profiles, posts, comments, messages, notifications, admin data
- **Redis**: Session storage, real-time caching, rate limiting counters
- **RabbitMQ**: Async job queue for AI processing and background tasks

---

## 🚀 Deployment & Infrastructure

- **AWS VPC**: Private network infrastructure for secure deployment
- **AWS S3**: Scalable file storage for media assets
- **Docker Compose**: Multi-service orchestration
- **Nginx**: Reverse proxy and load balancing
- **Firebase**: Real-time messaging and notifications

---

## 📱 Key Features

- ✅ Real-time messaging and notifications
- ✅ Social interactions (posts, comments, likes, follows)
- ✅ AI-powered content moderation (toxic detection)
- ✅ Admin dashboard with analytics
- ✅ User authentication and role management
- ✅ File upload and cloud storage
- ✅ Responsive UI with mobile optimization
- ✅ Rich text editor for content creation
- ✅ Semantic search and recommendations
- ✅ Notification system (likes, comments, follows)

---

## 🔗 Project Links

- **Backend Repository**: [Social Website Backend](https://github.com/your-username/social-website-backend)
- **Frontend Repository**: [Social Website Client](https://github.com/your-username/social-website-client)
- **AI Services**: [AI Services Module](https://github.com/your-username/social-website-ai)
- **Admin Dashboard**: [Admin Panel](https://github.com/your-username/social-website-admin)

---

## 📝 Notes

- All services are containerized for easy deployment and scaling
- Microservices architecture with separated AI processing pipeline
- Event-driven architecture using message queues for scalability
- Security-first approach with JWT, RBAC, and rate limiting
