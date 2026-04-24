import { Router } from 'express'
import multer from 'multer';
import { authenticateMiddleware } from '../middleware/verifyToken';
import commentController from '../controller/commentController';
import { validateUpdateComment, validateCreateComment } from '../validations/validation';

const router = Router()

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Image upload endpoint
router.post("/upload-image", authenticateMiddleware, upload.single('image'), commentController.uploadCommentImage);

router.post("/:id/create", authenticateMiddleware, validateCreateComment, commentController.createComment)
router.patch("/update", validateUpdateComment, commentController.updateComment)
router.delete("/delete", commentController.removeComment)
router.get("/:id", commentController.getComment)

// Content moderation routes
router.patch("/:id/hide", authenticateMiddleware, commentController.hideComment)
router.patch("/:id/unhide", authenticateMiddleware, commentController.unhideComment)

export default router;