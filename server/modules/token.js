

const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
    collection: 'tokens'
})

module.exports = mongoose.model('Token', tokenSchema);