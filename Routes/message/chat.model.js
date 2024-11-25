
const mongoose = require('mongoose');
const Schema = mongoose.Schema


const ChatSchema = new Schema(
  {
    owner: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      model: { type: String, required: true, enum: ['Staff', 'Student', 'Center'] },
    },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      model: { type: String, required: true, enum: ['Staff', 'Student', 'Center'] },
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', ChatSchema);


module.exports = Chat