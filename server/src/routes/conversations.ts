import { Router } from 'express';
import { 
    getAllConventionOfUser, 
    getMessageOfUser, 
    markMessagesAsRead,
    sendMessageWithMedia,
    grantPermissionUploadMedia,
    saveMessageMedia
} from "../controller/messageController";
import { authenticateMiddleware } from '../middleware/verifyToken';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `message-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'));
        }
    }
});

router.get('/all', authenticateMiddleware, getAllConventionOfUser)
router.get('/:id', authenticateMiddleware, getMessageOfUser)
router.patch('/:id/read', authenticateMiddleware, markMessagesAsRead)

// New routes for media messages
router.post('/send-media', authenticateMiddleware, upload.array('files', 10), sendMessageWithMedia)
router.post('/grant-permission', authenticateMiddleware, grantPermissionUploadMedia)
router.post('/save-media', authenticateMiddleware, saveMessageMedia)

export default router