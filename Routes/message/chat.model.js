
const mongoose = require('mongoose');
const Schema = mongoose.Schema


const ChatSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    marked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', ChatSchema);


module.exports = Chat