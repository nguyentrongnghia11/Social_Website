
const _Comment = require("../modules/comment");
const post = require("../modules/post");
class commentController {
    async createComment(req, res) {
        const { params: { id: postId }, user: { id: user }, body: { content } } = req;
        console.log(postId, user, content);
        const newComment = await _Comment.create({
            postId,
            content,
            user
        });

        if (!newComment) {
            return res.status(400).json({
                message: 'Create comment failed'
            })
        }

        return res.json({
            message: 'Create comment success',
            data: newComment
        })
    }
    async removeComment() {
        const { commentId } = req.body;
        const comment = await _Comment.findOneAndDelete({ _id: commentId });
        if (!comment) {
            return res.status(400).json({
                message: 'Comment not found'
            })
        }
        return res.json({
            message: 'Remove comment success'
        })
    }
}


module.exports = new commentController();