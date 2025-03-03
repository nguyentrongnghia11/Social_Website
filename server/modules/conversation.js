const mongoose = require('mongoose');


const conversationsSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
}, {

    timestamps: true,
    collection: 'conversations'
})

module.exports = mongoose.model('conversations', conversationsSchema);