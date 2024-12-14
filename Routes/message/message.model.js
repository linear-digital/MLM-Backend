const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Sender is required'],
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Receiver is required'],
        ref: 'User'
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
        type: String
    },
    audio: {
        type: String
    },
    video: {
        type: String
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