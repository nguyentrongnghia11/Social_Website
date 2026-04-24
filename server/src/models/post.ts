import { Schema, Document, model } from 'mongoose'
import mongoose_delete, { SoftDeleteDocument, SoftDeleteModel } from 'mongoose-delete'
import _User from './user'
import { Types } from 'mongoose';

export interface IAuthorSnapshot {
    _id: Types.ObjectId;
    name: string;
    username?: string;
    avt_url?: string;
}

export interface IPostMedia {
    url: string;
    resource_type: 'image' | 'video';
    public_id?: string;
    bytes?: number;
    width?: number;
    height?: number;
    format?: string;
}

export interface Post extends SoftDeleteDocument {
    title: string;
    artistId: Types.ObjectId;
    author?: IAuthorSnapshot;
    react: Types.ObjectId[];
    content: string;
    status: 'pending' | 'resovled' | 'reject';
    embedding: number[];

    media: IPostMedia[];
    imageCount: number;
    videoCount: number;
    thumbnail?: string;
}
const authorSnapshotSchema = new Schema<IAuthorSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    username: { type: String },
    avt_url: { type: String }
}, { _id: false });

const postMediaSchema = new Schema<IPostMedia>({
    url: { type: String, required: true },
    resource_type: { type: String, enum: ['image', 'video'], required: true },
    public_id: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    format: { type: String }
}, { _id: false });

const postSchema = new Schema<Post>({
    title: { type: String, required: true },

    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    author: { type: authorSnapshotSchema, required: false },

    react: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    status: { type: String, default: 'pending' },

    content: { type: String, required: true },

    embedding: { type: [Number], default: [] },

    media: {
        type: [postMediaSchema],
        default: []
    },
    imageCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    thumbnail: { type: String }

}, {
    timestamps: true,
    collection: 'posts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('comments', {
    ref: 'comments',
    localField: '_id',
    foreignField: 'postId',
    justOne: false
});

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

postSchema.index({ artistId: 1, createdAt: -1 });
postSchema.index({ react: 1 });
postSchema.index({ status: 1 });
postSchema.index({ embedding: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'author._id': 1 });
postSchema.index({ imageCount: 1 });
postSchema.index({ videoCount: 1 });

const PostModel = model<Post, SoftDeleteModel<Post>>('posts', postSchema);
export default PostModel;