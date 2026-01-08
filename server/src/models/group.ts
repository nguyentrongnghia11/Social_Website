import { NextFunction } from "express";
import { Schema, model, Document, ObjectId, Types } from "mongoose";



interface IGroup extends Document {
    userCreate: Types.ObjectId | string;
    name: string;
    members: string[] | ObjectId[];
    isPrivate: boolean;
    listAdmin: Types.ObjectId[]
}

const groupSchema = new Schema<IGroup>({
    userCreate: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPrivate: { type: Boolean, required: true },
    listAdmin: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]
}, {
    timestamps: true,
    collection: "groups"
})

groupSchema.pre<IGroup>('save', function (next) {
    if (!this.isNew) {
        next()
    }
    this.listAdmin.push(this.userCreate as Types.ObjectId)
    next()

})

// Index for performance
groupSchema.index({ members: 1 });
groupSchema.index({ userCreate: 1 });

export default model<IGroup>('Group', groupSchema);