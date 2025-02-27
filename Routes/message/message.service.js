const Chat = require("./chat.model")
const Message = require("./message.model")
const path = require('path')
const fs = require('fs')
const createMessage = async (data) => {
    try {
        const newMessage = new Message({
            ...data,
            seen: false
        })
        const result = await newMessage.save()
        await Chat.updateMany({
            $or: [
                { owner: data.sender, user: data.receiver },
                { owner: data.receiver, user: data.sender },
            ],
        }, {
            message: result._id
        })
        const message = await Message.findById(result._id)
            .populate('image')
        return message

    } catch (error) {
        throw new Error(error)
    }
}

const createNewChat = async (data) => {
    try {
        const { owner, user } = data;

        // Check if a chat already exists in both possible directions
        const [existingChat1, existingChat2] = await Promise.all([
            Chat.findOne({ user: owner, owner: user }),
            Chat.findOne({ user: user, owner: owner }),
        ]);

        // Create a new chat if no existing chat in either direction
        let newChat;
        if (!existingChat1) {
            await Chat.create({
                owner: user,
                user: owner,
            });
        }
        if (!existingChat2) {
            newChat = await Chat.create(data);
        }

        // Decide which chat to return: newChat or the existing one
        const chatToReturn = newChat || existingChat2;

        // Populate the chat before returning
        if (chatToReturn) {
            await chatToReturn.populate('owner', 'name username active lastActive');
            await chatToReturn.populate('user', 'name username active lastActive');
            await chatToReturn.populate('message');
        }

        return chatToReturn;
    } catch (error) {
        throw new Error(error.message || 'Error creating new chat');
    }
};


const getChats = async () => {
    try {
        // Fetch chats without population
        const chats = await Chat.find()
            .populate('owner', 'name username active lastActive')
            .populate('user', 'name username active lastActive')
            .sort({ updatedAt: -1 })
        return chats;
    } catch (error) {
        throw new Error(error.message || 'Error fetching chats');
    }
};

const chatByUser = async (id) => {
    try {
        // Fetch chats without population
        const chats = await Chat.find({ owner: id })
            .populate('owner', 'name username active lastActive')
            .populate('user', 'name username active lastActive')
            .populate('message')
            .sort({ updatedAt: -1 })
        const unseenMessages = await Promise.all(chats.map(async (chat) => {
            const messages = await Message.countDocuments({
                receiver: chat.owner._id,
                sender: chat.user._id,
                seen: { $in: [false, null] }
            })
            return {
                ...chat._doc,
                unseen: messages
            }
        }))
        return unseenMessages;
    } catch (error) {
        throw new Error(error.message || 'Error fetching chats');
    }
}
const getAChat = async (id) => {
    try {

        const chat = await Chat.findById(id)
            .populate('owner', 'name username active lastActive')
            .populate('user', 'name username active lastActive')
        if (!chat) {
            throw new Error('Chat not found');
        }

        return chat
    } catch (error) {
        throw new Error(error)
    }
}

const getAllMessages = async (query) => {
    try {
        const limit = parseInt(query.limit) || 100
        const page = parseInt(query.page) || 1
        const skip = (page - 1) * limit;
        const messages = await Message.find()
            .populate('sender')
            .populate('receiver')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
        return messages
    } catch (error) {
        throw new Error(error)
    }
}

const getMessages = async (query) => {
    try {
        const sender = query.sender
        const receiver = query.receiver
        const messages = await Message.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender },
            ],
        })
        return messages
    } catch (error) {
        throw new Error(error)
    }
}
const markChat = async (id) => {
    try {
        const chat = await Chat.findById(id)
        if (!chat) {
            throw new Error("Chat not found")
        }
        await Chat.findByIdAndUpdate(chat._id, {
            marked: !chat.marked
        })
        return chat
    } catch (error) {
        throw new Error(error)
    }
}
const deleteMessage = async (id) => {
    try {
        const message = await Message.findById(id)

        if (!message) {
            throw new Error("Message not found")
        }

        if (message.audio) {
            const pathF = message.audio.split('xyz/')[1]
            console.log(pathF);
            if (fs.existsSync(pathF)) {
                fs.unlinkSync(pathF)
            }
        }
        const data = await Message.findByIdAndDelete(id)
        return {
            message: "Message deleted successfully"
        }
    } catch (error) {
        throw new Error(error)
    }
}
const seenMessage = async (id) => {
    try {
        const chat = await Chat.findById(id)
        if (!chat) {
            throw new Error("Chat not found")
        }
        const seen = await Message.updateMany({
            receiver: chat.owner,
            sender: chat.user,
            seen: { $in: [false, null] }
        }, {
            seen: true
        }, {
            new: true
        })
        return seen
    } catch (error) {
        throw new Error(error)
    }
}
const updateMessage = async (id, data) => {
    try {
        const message = await Message.findByIdAndUpdate(id, data, {
            new: true
        })
        return message
    } catch (error) {
        throw new Error(error)
    }
}
const messageService = {
    createMessage,
    createNewChat,
    getChats,
    chatByUser,
    getAChat,
    getMessages,
    deleteMessage,
    markChat,
    seenMessage,
    getAllMessages,
    updateMessage
}

module.exports = messageService