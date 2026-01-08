import { Schema, Document, model, Types } from 'mongoose';

export interface IBannedWord extends Document {
    _id: Types.ObjectId;
    word: string;
    category: 'spam' | 'hate-speech' | 'fraud' | 'adult';
    addedBy: Types.ObjectId;
    isActive: boolean;
}

const bannedWordSchema = new Schema<IBannedWord>({
    word: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    category: {
        type: String,
        enum: ['spam', 'hate-speech', 'fraud', 'adult'],
        required: true
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

bannedWordSchema.index({ category: 1 });

export default model<IBannedWord>('BannedWord', bannedWordSchema);
