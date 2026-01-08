
import { Schema, model } from 'mongoose';

interface IOtp extends Document {
    email: string,
    otp: number
}

const otpSchema = new Schema<IOtp>({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        required: true,

    }
}, {
    timestamps: true,
    collection: 'otp',
    expires: '1m'
})

export default model<IOtp>('Otp', otpSchema);