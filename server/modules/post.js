
const mongoose = require('mongoose');
var mongoose_delete = require('mongoose-delete');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },

    react: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            react: {
                type: Number,
                required: true
            }
            , default: []
        }
    ],
    status: {
        type: Number,
        default: 0
    },


    imgUrl: {
        type: String,
        default: ''
    },

    content: {
        type: String,
        required: true
    },
}, {

    timestamps: true,
    collection: 'posts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

postSchema.virtual('comments', {
    ref: 'comments',
    localField: '_id',
    foreignField: 'postId',
    justOne: false
});



postSchema.plugin(mongoose_delete, { overrideMethods: 'all' });

module.exports = mongoose.model('posts', postSchema);