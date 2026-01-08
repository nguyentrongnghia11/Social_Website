
import { Schema, Document, model } from 'mongoose'
import mongoose_delete from 'mongoose-delete'
import _User from './user'
import { Types } from 'mongoose';
import { number } from 'joi';
import { fileSchema, IFile } from './file';

export interface Post extends Document {
    title: string,
    artistId: Types.ObjectId;
    react: [Types.ObjectId];
    content: string;
    status: "pending" | "resovled" | "reject";
    visibility: "published" | "hidden";
    embedding: number[]
}

const postSchema = new Schema<Post>({
    title: {
        type: String,
        required: true
    },

    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    react: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    status: {
        type: String,
        default: "pending"
    },
    visibility: {
        type: String,
        enum: ["published", "hidden"],
        default: "published"
    },

    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        require: false,
        default: []
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

// Dùng post('save') thay vì pre('save')
postSchema.post('save', async function (doc, next) {
    try {
        const result = await _User.findByIdAndUpdate(
            doc.artistId,
            { $addToSet: { posts: doc._id } }
        );

        if (!result) {
            console.error(`User not found for artistId: ${doc.artistId}. Post _id: ${doc._id}`);
        }

        next();
    } catch (err: any) {
        return next(err);
    }
});




postSchema.plugin(mongoose_delete, { overrideMethods: 'all' });

// Indexes for performance
postSchema.index({ artistId: 1, createdAt: -1 });
postSchema.index({ react: 1 });
postSchema.index({ status: 1 });
postSchema.index({ embedding: 1 });

export default model<Post>('posts', postSchema);