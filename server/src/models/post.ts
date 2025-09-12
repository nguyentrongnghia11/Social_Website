
import { Schema, Document, model } from 'mongoose'
import mongoose_delete from 'mongoose-delete'
import _User from './user'

import { Types } from 'mongoose';
import { ref } from 'process';

interface Post extends Document {
    title: string,
    artistId: Types.ObjectId;
    react: [Types.ObjectId];
    status: number;
    imgUrl: string[];
    vidUrl: string[]
    content: string;
}

const postSchema = new Schema<Post>({
    title: {
        type: String,
        required: true
    },

    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },

    react: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Account'
        }
    ],
    status: {
        type: Number,
        default: 0
    },


    imgUrl: {
        type: [String],
        default: []
    },
    vidUrl: {
        type: [String],
        default: []
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

postSchema.pre('save', async function (next) {
    if (!this.isNew) return next(); // Chỉ chạy khi tạo mới

    try {
        const result = await _User.findByIdAndUpdate(
            this.artistId,
            { $addToSet: { posts: this._id } }
        );

        if (!result) {
            return next(new Error('User not found'));
        }

        next();
    } catch (err: any) {
        return next(err);
    }
});




postSchema.plugin(mongoose_delete, { overrideMethods: 'all' });

export default model<Post>('posts', postSchema);