


const express = require('express');
const router = express.Router();
const post = require('../controller/PostController');
const passport = require('passport');
const verifyToken = require('../services/getPublicKeyy');
const { authenticateMiddleware } = require('../middleware/verifyToken_services')
const commentController = require('../controller/commentController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Lấy đuôi file
        cb(null, file.fieldname + '-' + Date.now() + ext); // Giữ đuôi file
    }
});

const upload = multer({ dest: 'uploads/', storage: storage, limits: { fieldSize: 25 * 1024 * 1024 } });

//router.post("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.updatePost)
// router.delete("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.removePost)
// router.patch("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.reactPost)
// router.post("/", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.createPost)


router.get("/all", post.getAllPost)
router.get("/mypost", authenticateMiddleware, post.getMyPost)
router.post("/:id/comment", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), commentController.createComment)
router.post("/upload", upload.single('image'), post.uploadImgaes)
router.put("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.updatePost)
router.post("/", authenticateMiddleware, upload.single('image'), post.createPost)
router.patch("/:id/react", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.reactPost)
router.patch("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.moderationPost)
router.delete("/:id/hidden", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.hiddenPost)
router.delete("/:id", passport.authenticate(['jwt', 'oauth2'], { failureRedirect: '/' }), post.removePost)


// passport.authenticate('jwt', { session: false }),
module.exports = router;