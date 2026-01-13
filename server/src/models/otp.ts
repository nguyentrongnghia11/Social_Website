
import { Schema, model } from 'mongoose';

interface IOtp extends Document {
    email: string,
    otp: number,
    createdAt: Date
}

const otpSchema = new Schema<IOtp>({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 // Tự động xóa sau 60 giây
    }
}, {
    collection: 'otp'
})

export default model<IOtp>('Otp', otpSchema);