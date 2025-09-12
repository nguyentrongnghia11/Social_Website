import { Router } from 'express'
import { authenticateMiddleware } from '../middleware/verifyToken_services';
import commentController from '../controller/commentController';

const router = Router()
router.post("/:id/create", authenticateMiddleware, commentController.createComment)
router.patch("/update", commentController.updateComment)
router.delete("/delete", commentController.removeComment)
router.get("/:id", commentController.getComment.bind(commentController))

export default router;