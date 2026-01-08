import { Schema, Document, model, Types } from 'mongoose';

export interface IMedia extends Document {
    _id: Types.ObjectId;
    url: string;
    type: 'image' | 'video';
    size: number;
    uploadedBy: Types.ObjectId;
    postId?: Types.ObjectId;
    commentId?: Types.ObjectId;
    status: 'active' | 'blocked';
    cloudinaryId?: string;
}

const mediaSchema = new Schema<IMedia>({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'posts'
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'comments'
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    },
    cloudinaryId: {
        type: String
    }
}, { timestamps: true });

mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ status: 1 });

export default model<IMedia>('Media', mediaSchema);
