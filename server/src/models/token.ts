

import { Schema, Document, model } from 'mongoose'

export interface Token {
    email: string;
    refreshToken: string;
    publicKey: string,
    device: string
}

const tokenSchema = new Schema<Token>({
    email: {
        type: String,
        required: true,
        Ref: 'User'
    },

    refreshToken: {
        type: String,
        required: true
    },
    publicKey: {
        type: String,
        required: true
    },
    device: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'tokens'
})

tokenSchema.index({ email: 1, device: 1 }, { unique: true });

export default model<Token>('Token', tokenSchema);