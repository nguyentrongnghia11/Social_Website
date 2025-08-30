


import express, { Request, Response } from 'express'
const router = express.Router();
import post from '../controller/PostController';
const passport = require('passport');
import { authenticateMiddleware } from '../middleware/verifyToken_services'
import commentController from '../controller/commentController';
const multer = require('multer');
//import {Multer} from 'multer'

const path = require('path');

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
router.get("/all/sendmessage", post.sendMessage)
router.get("/mypost", authenticateMiddleware, post.getMyPost)
router.get("/liked", authenticateMiddleware, post.getPostLikedOfUser)
router.get("/commented", authenticateMiddleware, post.getPostUserCommented)

router.get("/user/all", authenticateMiddleware, post.getPostOfUser)
//router.post("/upload", upload.array('image', 5), post.uploadImgaes)
router.post("/create", authenticateMiddleware, upload.fields([{ name: 'image', maxCount: 5 },
{ name: 'video', maxCount: 2 }]), post.createPost)
router.patch("/react", authenticateMiddleware, post.reactPost)
router.delete("/:id/hidden", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.hiddenPost)
router.get("/:id", post.getPost)
router.delete("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.removePost)
router.patch("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.moderationPost)
router.put("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.updatePost)


// passport.authenticate('jwt', { session: false }),
export default router;