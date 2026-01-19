import { Router } from 'express'
import { authenticateMiddleware } from '../middleware/verifyToken';
import commentController from '../controller/commentController';
import { validateUpdateComment, validateCreateComment } from '../validations/validation';

const router = Router()
router.post("/:id/create", authenticateMiddleware, validateCreateComment, commentController.createComment)
router.patch("/update", validateUpdateComment, commentController.updateComment)
router.delete("/delete", commentController.removeComment)
router.get("/:id", commentController.getComment.bind(commentController))

// Content moderation routes
router.patch("/:id/hide", authenticateMiddleware, commentController.hideComment)
router.patch("/:id/unhide", authenticateMiddleware, commentController.unhideComment)

export default router;