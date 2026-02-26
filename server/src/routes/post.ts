


import express, { Request, Response } from 'express'
const router = express.Router();
import post from '../controller/PostController';
import passport from 'passport';
import { authenticateMiddleware } from '../middleware/verifyToken'
import commentController from '../controller/commentController';
import multer from 'multer';

import path from 'path';
import { limiter } from '../middleware/checkRatelimt';
import { validateCreatePost, validateUpdatePost } from '../validations/validation';

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage });

//router.post("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.updatePost)
// router.delete("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.removePost)
// router.patch("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.reactPost)
// router.post("/", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.createPost)


router.get("/all", post.getAllPost)
router.get("/search", post.searchPost)
router.get("/mypost", authenticateMiddleware, post.getMyPost)
router.get("/liked", authenticateMiddleware, post.getPostLikedOfUser)
router.get("/commented", authenticateMiddleware, post.getPostUserCommented)
router.get("/user/all", authenticateMiddleware, post.getPostOfUser)
router.get("/top", post.getTopPost)
router.post("/create", authenticateMiddleware, validateCreatePost, upload.fields([{ name: 'image', maxCount: 5 },
{ name: 'video', maxCount: 2 }]), post.createPost)
router.patch("/react", authenticateMiddleware, limiter, post.reactPost)
router.post("/grant-permission", authenticateMiddleware, post.grantPermissionUploadFile)
router.post("/:id/grant-permission", authenticateMiddleware, post.grantPermissionForUpdatePost)
router.post("/save/media", authenticateMiddleware, post.updateFile)
router.delete("/:id/hidden", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.hiddenPost)
router.get("/:id/similar", authenticateMiddleware, post.getSimilarPosts)
router.get("/:id", post.getPost)
router.delete("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.removePost)
// router.patch("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.moderationPost)
router.patch("/:id", authenticateMiddleware, validateUpdatePost, post.updatePost)

// Content moderation routes
router.patch("/:id/hide", authenticateMiddleware, post.hidePost)
router.patch("/:id/unhide", authenticateMiddleware, post.unhidePost)

export default router;  