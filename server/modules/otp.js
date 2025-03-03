
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
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
    // expires: '2m'
})

module.exports = mongoose.model('Otp', otpSchema);