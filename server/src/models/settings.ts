import { Schema, Document, model, Types } from 'mongoose';

export interface ISettings extends Document {
    _id: Types.ObjectId;
    siteName: string;
    contactEmail: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    allowGoogleAuth: boolean;
    maxUploadSize: number;
    allowedFileTypes: string[];
    moderationEnabled: boolean;
    autoModeration: boolean;
    updatedBy: Types.ObjectId;
}

const settingsSchema = new Schema<ISettings>({
    siteName: {
        type: String,
        default: 'Social Network'
    },
    contactEmail: {
        type: String,
        required: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    allowRegistration: {
        type: Boolean,
        default: true
    },
    allowGoogleAuth: {
        type: Boolean,
        default: true
    },
    maxUploadSize: {
        type: Number,
        default: 10485760 // 10MB in bytes
    },
    allowedFileTypes: {
        type: [String],
        default: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov']
    },
    moderationEnabled: {
        type: Boolean,
        default: true
    },
    autoModeration: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default model<ISettings>('Settings', settingsSchema);
