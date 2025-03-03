
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['admin', 'user'],
        required: true,
        default: 'user'
    },

    password: {
        type: String,
        required: function () {
            return this.type === 'local';
        }
    },

    imgUrl: {

        type: String,
        required: false
    },

    type: {
        type: String,
        enum: ['local', 'google'],
        required: true

    },

    postId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: []
        }
    ]
})


module.exports = mongoose.model('Account', userSchema);