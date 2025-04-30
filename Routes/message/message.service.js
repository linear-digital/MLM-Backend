const Chat = require("./chat.model")
const Message = require("./message.model")
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
            .populate('reply')
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

// const chatByUser = async (id, data) => {
//     try {
//         const { skip, limit, page } = data;

//         // Fetch chats
//         const chats = await Chat.find({ owner: id })
//             .populate('user', 'name username active lastActive')
//             .populate('message')
//             .sort({ updatedAt: -1 })
//             .lean(); // Use lean for faster query

//         const validChats = chats.filter(chat => chat.owner && chat.user);

//         // Collect all user IDs for unseen message counting
//         const userIds = validChats.map(chat => chat.user._id);

//         // Pre-fetch unseen message counts
//         const unseenMessagesCounts = await Message.aggregate([
//             {
//                 $match: {
//                     sender: { $in: userIds },
//                     seen: { $in: [false, null] }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$sender",
//                     count: { $sum: 1 }
//                 }
//             },
//         ]);

//         // Attach unseen count to chats
//         const chatsWithUnseen = validChats.map(chat => ({
//             ...chat,
//             unseen: unseenMessagesCounts.find(um => um._id.toString() === chat.user._id.toString())?.count || 0,
//         }));

//         // Pagination calculation
//         const total = await Chat.countDocuments({ owner: id });
//         const totalPage = Math.ceil(total / limit);
//         const fChats = chatsWithUnseen.slice(skip, skip + limit);
//         const result = {
//             limit: fChats.length,
//             unseen: unseenMessagesCounts.length,
//             page,
//             skip,
//             nextPage: page + 1,
//             prevPage: page > 0 ? page - 1 : null,
//             hasNextPage: page < totalPage - 1,
//             hasPrevPage: page > 0,
//             totalPage,
//             total,
//             chats: fChats
//         };

//         return result;
//     } catch (error) {
//         console.error('Error in chatByUser:', error);
//         throw error; // Rethrow or customize if needed
//     }
// };

const chatByUser = async (id) => {
    try {
        // Fetch chats with population
        const chats = await Chat.find({ owner: id })
            .populate('user', 'name username active lastActive')
            .populate('message')
            .sort({ updatedAt: -1 });

        // Filter out any chats where owner or user is missing
        const validChats = chats.filter(chat => chat.owner && chat.user);

        // Extract user IDs for unseen message counting
        const userIds = validChats.map(chat => chat.user._id);
        const ownerId = validChats.map(chat => chat.owner._id);

        // Count unseen messages in a single query
        const unseenCounts = await Message.aggregate([
            {
                $match: {
                    receiver: { $in: ownerId },
                    seen: { $in: [false, null] }
                }
            },
            {
                $group: {
                    _id: { receiver: "$receiver", sender: "$sender" },
                    count: { $sum: 1 }
                }
            }
        ]);
        // Create a map for quick lookup of unseen message counts
        const unseenMap = unseenCounts.reduce((acc, { _id, count }) => {
            acc[`${_id.receiver}-${_id.sender}`] = count;
            return acc;
        }, {});

        // Map unseen counts back to chats
        const unseenMessages = validChats.map(chat => {
            const key = `${chat.owner._id}-${chat.user._id}`;
            return {
                ...chat._doc,
                unseen: unseenMap[key] || 0
            };
        });
        return unseenMessages;
    } catch (error) {
        throw new Error(error.message || 'Error fetching chats');
    }
};
const searchMessages = async (query) => {
    try {
        const { user, text } = query;

        const result = await Message.find({
            $or: [
                { sender: user },
                { receiver: user }
            ],
            message: { $regex: text, $options: 'i' }
        }).populate('sender', 'name username active lastActive')
            .populate('receiver', 'name username active lastActive')

        return {
            total: result.length,
            messages: result
        };
    } catch (error) {
        console.error("Error in searchMessages:", error);
        throw error; // Preserves stack trace
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
        const filter = {}

        if (query.user) {
            filter.$or = [
                { sender: query.user },
                { receiver: query.user }
            ];
        }
        const messages = await Message.find(filter)
            .populate('sender')
            .populate('receiver')
            .populate('reply')
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
        const limit = parseInt(query.limit) || 200
        const page = parseInt(query.page) || 1
        const skip = (page - 1) * limit;
        const filter = {
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender },
            ]
        }
        const messages = await Message.find(filter)
            .populate("reply")
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
    updateMessage,
    searchMessages
}

module.exports = messageService