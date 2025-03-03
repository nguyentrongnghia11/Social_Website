const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    senderId: {

        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    content: {
        type: String,
        required: true
    }
}, {

    timestamps: true,
    collection: 'messages'

})

module.exports = mongoose.model('message', messageSchema);