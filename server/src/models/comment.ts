import { NextFunction } from "express";
import { Types, Document, Schema, model, Model } from "mongoose";
import MongooseDelete, { SoftDeleteDocument, SoftDeleteModel } from 'mongoose-delete';

// Snapshot thông tin tác giả — nhúng trực tiếp để tránh $lookup
export interface IAuthorSnapshot {
    _id: Types.ObjectId;
    name: string;
    avt_url?: string;
}

export interface IComment {
    _id: Types.ObjectId;
    postId: Types.ObjectId | string;
    content: string;
    imageUrl?: string;
    userId: Types.ObjectId | string;
    author?: IAuthorSnapshot;          // Extended Reference: snapshot tại thời điểm tạo
    parentID: Types.ObjectId | null;
    path: string;
    isDelete: boolean;
    isToxic: string;
}

export type ICommentDocument = IComment & Document & SoftDeleteDocument;
export type ICommentModel = SoftDeleteModel<ICommentDocument>;

const authorSnapshotSchema = new Schema<IAuthorSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    avt_url: { type: String }
}, { _id: false });

const commentSchema = new Schema<ICommentDocument, ICommentModel>({
    postId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'posts'
    },
    content: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Extended Reference: embed author info để tránh $lookup mỗi lần get comments
    author: {
        type: authorSnapshotSchema,
        required: false
    },
    parentID: {
        type: Schema.Types.ObjectId,
        ref: 'comments',
    },
    path: {
        type: String,
        required: true
    },
    isToxic: {
        type: String,
        default: "clean"
    }
}, {
    timestamps: true,
    collection: 'comments',
    virtuals: true,
});

commentSchema.pre('save', async function (next) {
    console.log(123)
    if (this.parentID) {
        const CommentModel = this.constructor as Model<IComment>;
        const parent = await CommentModel.findById(this.parentID);

        if (parent) {
            this.path = `${parent.path},${this._id}`
            console.log(this.path)
        } else {
            console.log("Comment parent was deleted")
            next();
        }
    } else {
        this.path = `${this._id}`;
        this.parentID = null;
    }
    next();
});

commentSchema.plugin(MongooseDelete as any, { overrideMethods: 'all', deletedAt: true });

// Indexes
commentSchema.index({ postId: 1, createdAt: -1 });   // get comments của post theo thời gian
commentSchema.index({ path: 1 });                     // nested tree query
commentSchema.index({ userId: 1 });                   // query comments của user

export default model<ICommentDocument, ICommentModel>('comments', commentSchema);
