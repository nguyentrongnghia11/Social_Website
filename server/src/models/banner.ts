import { Schema, Document, model, Types } from 'mongoose';

export interface IBanner extends Document {
    _id: Types.ObjectId;
    title: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'sidebar' | 'popup';
    imageUrl: string;
    link?: string;
    active: boolean;
    startDate?: Date;
    endDate?: Date;
    createdBy: Types.ObjectId;
    order: number;
}

const bannerSchema = new Schema<IBanner>({
    title: {
        type: String,
        required: true
    },
    position: {
        type: String,
        enum: ['top', 'bottom', 'left', 'right', 'sidebar', 'popup'],
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

bannerSchema.index({ active: 1, position: 1, order: 1 });

export default model<IBanner>('Banner', bannerSchema);
