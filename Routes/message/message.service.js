const Chat = require("./chat.model")
const Message = require("./message.model")


const createMessage = async (data) => {
    try {
        const newMessage = new Message(data)
        const result = await newMessage.save()
        await Chat.updateMany({
            $or: [
                { "owner.id": data.sender, "user.id": data.receiver },
                { "owner.id": data.receiver, "user.id": data.sender },
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
            Chat.findOne({ "user.id": owner.id, "owner.id": user.id }),
            Chat.findOne({ "user.id": user.id, "owner.id": owner.id }),
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
            await chatToReturn.populate([
                {
                    path: 'owner.id',
                    model: chatToReturn.owner.model, // Dynamic model
                    select: 'firstName lastName profilePic',
                },
                {
                    path: 'user.id',
                    model: chatToReturn.user.model, // Dynamic model
                    select: 'firstName lastName profilePic',
                },
            ]);
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
            .sort({ updatedAt: -1 })

        // Dynamically apply population for each chat
        await Promise.all(
            chats.map(async (chat) => {
                // Populate owner dynamically
                if (chat.owner?.id && chat.owner?.model) {
                    await chat.populate({
                        path: 'owner.id',
                        model: chat.owner.model, // Specify dynamic model
                        select: 'firstName lastName profilePic',
                    });
                }

                // Populate user dynamically
                if (chat.user?.id && chat.user?.model) {
                    await chat.populate({
                        path: 'user.id',
                        model: chat.user.model, // Specify dynamic model
                        select: 'firstName lastName profilePic',
                    });
                }

                // Populate message (static reference)
                await chat.populate('message');
            })
        );

        return chats;
    } catch (error) {
        throw new Error(error.message || 'Error fetching chats');
    }
};

const chatByUser = async (id) => {
    try {
        // Fetch chats without population
        const chats = await Chat.find({ "owner.id": id })
            .sort({ updatedAt: -1 })

        // Dynamically apply population based on the `model` field
        for (const chat of chats) {
            // // Populate owner dynamically
            // if (chat.owner?.id && chat.owner?.model) {
            //     await chat.populate({
            //         path: 'owner.id',
            //         model: chat.owner.model as DynamicModel, // Dynamically select the model
            //         select: 'firstName lastName profilePic',
            //     });
            // }

            // Populate user dynamically
            if (chat.user?.id && chat.user?.model) {
                await chat.populate({
                    path: 'user.id',
                    model: chat.user.model, // Dynamically select the model
                    select: 'firstName lastName profilePic',
                });
            }

            // Populate message (static reference)
            await chat.populate('message');
        }

        return chats;
    } catch (error) {
        throw new Error(error.message || 'Error fetching chats');
    }
}
const getAChat = async (id) => {
    try {
        const chat = await Chat.findById(id)
        if (!chat) {
            throw new Error('Chat not found');
        }
        // Populate owner dynamically
        if (chat.owner?.id && chat.owner?.model) {
            await chat.populate({
                path: 'owner.id',
                model: chat.owner.model, // Dynamically select the model
                select: 'firstName lastName profilePic',
            });
        }

        // Populate user dynamically
        if (chat.user?.id && chat.user?.model) {
            await chat.populate({
                path: 'user.id',
                model: chat.user.model, // Dynamically select the model
                select: 'firstName lastName profilePic',
            });
        }

        // Populate message (static reference)
        await chat.populate('message');

        return chat
    } catch (error) {
        throw new Error(error)
    }
}

const getMessages = async (query) => {
    try {
        const chat = await Chat.findById(query.chat)
        if (!chat) {
            throw new Error('Chat not found');
        }
        const messages = await Message.find({
            chat: query.chat
        })
        return messages
    } catch (error) {
        throw new Error(error)
    }
}

const deleteMessage = async (id) => {
    try {
        const data = await Message.findByIdAndDelete(id)
        if (!data) {
            throw new Error("Message not found")
        }
        return {
            message: "Message deleted successfully"
        }
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
    deleteMessage
}

module.exports = messageService