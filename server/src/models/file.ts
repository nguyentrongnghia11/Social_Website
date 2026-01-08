
import { Schema, model, Document, ObjectId } from "mongoose"

export interface IFile extends Document {
    secure_url: string,
    bytes: number,
    width: number,
    height: number
    public_id: string,
    postId: ObjectId,
    folder: string,
    resource_type: string,
    app_tags?: string[]
    cloud_tags?: string[]
}

export const fileSchema = new Schema<IFile>({
    secure_url: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    public_id: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, required: true, ref: 'posts' },
    folder: { type: String, required: true },
    resource_type: { type: String, required: true },
    app_tags: { type: [], required: false },
    cloud_tags: { type: [], required: false },
}, {
    collection: "files",
    timestamps: true
})

export default model<IFile>('files', fileSchema)