/**
 * Post Response Format - Standard Structure
 * 
 * Backend MUST return post data in this exact format
 * to ensure consistency across all PostCard displays
 */

/**
 * @typedef {Object} PostAuthor
 * @property {string} _id - User ID
 * @property {string} name - User name
 * @property {string} [avatar] - User avatar URL
 * @property {string} [email] - User email
 */

/**
 * @typedef {Object} Post
 * @property {string} _id - Post ID
 * @property {string} title - Post title
 * @property {string} content - Post content (HTML format)
 * 
 * @property {PostAuthor} author - Post author information
 * @property {PostAuthor} [user] - Alternative field for author (legacy support)
 * 
 * @property {number} likeCount - Total number of likes
 * @property {boolean} liked - Has current user liked this post (requires authentication)
 * @property {Array<{_id: string, username: string}>} [userLikePreview] - Array of users who liked (max 3 for avatar preview)
 * 
 * @property {number} commentCount - Total number of comments
 * 
 * @property {string[]} [imgUrl] - Array of image URLs (supports multiple images)
 * @property {string[]} [videoUrl] - Array of video URLs (supports multiple videos)
 * @property {string[]} [files] - Array of file URLs (generic files)
 * 
 * @property {number} [imageCount] - Precomputed image count (for preview mode performance)
 * @property {number} [videoCount] - Precomputed video count (for preview mode performance)
 * 
 * @property {Date|string} createdAt - Post creation timestamp
 * @property {Date|string} [updatedAt] - Post last update timestamp
 * @property {boolean} [edited] - Has post been edited
 * 
 * @property {string} [status] - Post status (active, deleted, hidden, etc.)
 */

/**
 * Example Post Response:
 * 
 * {
 *   "_id": "694cb6e7ff117b7c8e36e048",
 *   "title": "My First Post",
 *   "content": "<p>This is the post content</p>",
 *   
 *   "author": {
 *     "_id": "user123",
 *     "name": "John Doe",
 *     "avatar": "https://example.com/avatar.jpg"
 *   },
 *   
 *   "likeCount": 10,
 *   "liked": true,
 *   "userLikePreview": [
 *     { "_id": "user1", "username": "john_doe" },
 *     { "_id": "user2", "username": "jane_smith" },
 *     { "_id": "user3", "username": "bob_wilson" }
 *   ],
 *   
 *   "commentCount": 5,
 *   
 *   "imgUrl": [
 *     "https://s3.amazonaws.com/bucket/image1.jpg",
 *     "https://s3.amazonaws.com/bucket/image2.jpg"
 *   ],
 *   "videoUrl": [
 *     "https://s3.amazonaws.com/bucket/video1.mp4"
 *   ],
 *   
 *   "imageCount": 2,
 *   "videoCount": 1,
 *   
 *   "createdAt": "2025-12-25T10:30:00Z",
 *   "edited": false,
 *   "status": "active"
 * }
 */

/**
 * API Response Wrapper
 * 
 * @typedef {Object} PostResponse
 * @property {string} message - Response message
 * @property {Post|Post[]} result - Post data (single or array)
 * @property {number} [status] - HTTP status code
 */

/**
 * Example API Response:
 * 
 * GET /api/posts/:id
 * {
 *   "message": "Get post success",
 *   "result": [{ ...Post }]
 * }
 * 
 * GET /api/posts
 * {
 *   "message": "Get posts success",
 *   "result": [{ ...Post }, { ...Post }]
 * }
 */

export default {};
