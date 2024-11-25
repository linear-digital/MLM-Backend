const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Sender is required']
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Receiver is required']
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: [true, 'Chat is required']
    },
    message: {
        type: String,
    },
    image: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Upload'
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    reply: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Message',
    },
    seen: {
        type: Boolean,
    },
    deleted: {
        type: Boolean,
    },
}, {
    timestamps: true
})

const Message = mongoose.model('Message', schema);

module.exports = Message