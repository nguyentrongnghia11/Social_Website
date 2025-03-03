const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'posts'    
    },

    content: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, {

    timestamps: true,
    collection: 'comments',
    virtuals: true,
    
})




module.exports = mongoose.model('comments', commentSchema);