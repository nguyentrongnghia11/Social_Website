import { ObjectId, Schema, model } from "mongoose";

export interface INotification extends Document {

    message: string;
    title: string;
    receiver: string | ObjectId;
    sender?: string | ObjectId; // người gửi thông báo
    type: 'login' | 'message' | 'comment' | 'like' | 'follow' | "invite" | string; // mở rộng được
    read: boolean;
    link?: string; // optional: dùng để redirect khi nhấp
    postId?: string | ObjectId; // ID bài viết (nếu liên quan)
}


const notifycationSchema = new Schema<INotification>({
    message: { type: String, required: true },
    title: { type: String },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['login', 'message', 'comment', 'like', 'follow', 'invite'], required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' }
}, {
    collection: 'notifications',
    timestamps: true
})


export default model<INotification>('Notification', notifycationSchema);
