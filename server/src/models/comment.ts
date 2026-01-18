import { NextFunction } from "express";
import { boolean } from "joi";
import { Types, Document, Schema, model, Model } from "mongoose";

// import mongoose_delete from 'mongoose-delete'
import MongooseDelete, { SoftDeleteDocument, SoftDeleteModel } from 'mongoose-delete';


export interface IComment {
    _id: Types.ObjectId;
    postId: Types.ObjectId | string;
    content: string;
    userId: Types.ObjectId | string;
    parentID: Types.ObjectId | null;
    path: string;
    isDelete: boolean;
    isToxic: boolean;
    visibility: 'published' | 'hidden';
}

export type ICommentDocument = IComment & Document & SoftDeleteDocument;

export type ICommentModel = SoftDeleteModel<ICommentDocument>


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
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['published', 'hidden'],
        default: 'published'
    }

}, {

    timestamps: true,
    collection: 'comments',
    virtuals: true,

})

commentSchema.pre('save', async function (next) {
    console.log(123)
    if (this.parentID) {

        const CommentModel = this.constructor as Model<IComment>;
        const parent = await CommentModel.findById(this.parentID);


        if (parent) {
            this.path = `${parent.path},${this._id}`
            console.log(this.path)

        }
        else {
            console.log("Comment parent was deleted")
            next();
        }
    }

    else {
        this.path = `${this._id}`;
        this.parentID = null;

    }
    next();
});


commentSchema.plugin(MongooseDelete as any, { overrideMethods: 'all', deletedAt: true });

export default model<ICommentDocument, ICommentModel>('comments', commentSchema);
