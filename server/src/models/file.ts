
import { Schema, model, Document, ObjectId } from "mongoose"

export interface IFile extends Document {
    secure_url: string,
    bytes: number,
    width?: number,
    height?: number
    public_id: string,
    postId?: ObjectId,
    messageId?: ObjectId,
    conversationId?: ObjectId,
    uploadedBy?: ObjectId,
    folder: string,
    resource_type: string,
    app_tags?: string[]
    cloud_tags?: string[]
}

export const fileSchema = new Schema<IFile>({
    secure_url: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number, required: false },
    height: { type: Number, required: false },
    public_id: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, required: false, ref: 'posts' },
    messageId: { type: Schema.Types.ObjectId, required: false, ref: 'message' },
    conversationId: { type: Schema.Types.ObjectId, required: false, ref: 'conversations' },
    uploadedBy: { type: Schema.Types.ObjectId, required: false, ref: 'users' },
    folder: { type: String, required: false },
    resource_type: { type: String, required: true },
    app_tags: { type: [], required: false },
    cloud_tags: { type: [], required: false },
}, {
    collection: "files",
    timestamps: true
})

export default model<IFile>('files', fileSchema)