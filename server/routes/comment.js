

const router = require('express').Router();

const comment = require('../controller/commentController');

router.post("/:id",comment.createComment);

module.exports = router;