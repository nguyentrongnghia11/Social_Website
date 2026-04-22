import { ObjectId, Schema, model } from "mongoose";

export interface ISenderSnapshot {
    _id: ObjectId;
    name: string;
    avt_url?: string;
}

export interface INotification extends Document {
    message: string;
    title: string;
    receiver: string | ObjectId;
    sender?: string | ObjectId;
    senderInfo?: ISenderSnapshot;
    type: 'login' | 'message' | 'comment' | 'like' | 'follow' | "invite" | string;
    read: boolean;
    link?: string;
    postId?: string | ObjectId;
}

const senderSnapshotSchema = new Schema<ISenderSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    avt_url: { type: String }
}, { _id: false });

const notifycationSchema = new Schema<INotification>({
    message: { type: String, required: true },
    title: { type: String },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    // Extended Reference: embed sender info để tránh $lookup trong getNotificationsByReceiver
    senderInfo: {
        type: senderSnapshotSchema,
        required: false
    },
    type: { type: String, enum: ['login', 'message', 'comment', 'like', 'follow', 'invite'], required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' }
}, {
    collection: 'notifications',
    timestamps: true
});

// Indexes — các trường hay được query cùng nhau
notifycationSchema.index({ receiver: 1, createdAt: -1 });  // get notifications của user theo thời gian
notifycationSchema.index({ receiver: 1, read: 1 });        // đếm unread, mark all read
notifycationSchema.index({ receiver: 1, read: 1, createdAt: -1 }); // compound cho query phổ biến nhất

export default model<INotification>('Notification', notifycationSchema);
