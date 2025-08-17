import { ObjectId, Schema, model } from "mongoose";

export interface INotification extends Document {

    message: string;
    title: string;
    receiver: string | ObjectId;
    type: 'login' | 'message' | 'comment' | 'like' | "invite" | string; // mở rộng được
    read: boolean;
    link?: string; // optional: dùng để redirect khi nhấp
}


const notifycationSchema = new Schema<INotification>({
    message: { type: String, required: true },
    title: { type: String },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['login', 'message', 'comment', 'like', 'invite'], required: true },
    read: { type: Boolean, default: false },
    link: { type: String }
}, {
    collection: 'notifications',
    timestamps: true
})


export default model<INotification>('Notification', notifycationSchema);
