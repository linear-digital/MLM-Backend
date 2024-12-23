const messageService = require("./message.service")
const router = require("express").Router();
const createMessage = async (req, res) => {
    try {
        const data = req.body
        const result = await messageService.createMessage(data)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}

const createNewChat = async (req, res) => {
    try {
        const data = req.body

        const result = await messageService.createNewChat(data)

        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}

const getChats = async (req, res) => {
    try {
        const result = await messageService.getChats()
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const chatByUser = async (req, res) => {
    try {
        const result = await messageService.chatByUser(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}

const getAChat = async (req, res) => {
    try {
        const result = await messageService.getAChat(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const getMessages = async (req, res) => {
    try {
        const result = await messageService.getMessages(req.query)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const deleteMessage = async (req, res) => {
    try {
        const result = await messageService.deleteMessage(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const markChat = async (req, res) => {
    try {
        const result = await messageService.markChat(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const messageController = {
    createMessage,
    createNewChat,
    getChats,
    chatByUser,
    getAChat,
    getMessages,
    deleteMessage
}

router.post("/", messageController.createMessage)
router.post("/chat", messageController.createNewChat)
router.put("/chat/:id", markChat)

router.get("/chats", messageController.getChats)
router.get("/user/:id", messageController.chatByUser)
router.get("/:id", messageController.getAChat)
router.get("/msg/all", messageController.getMessages)
router.delete("/:id", messageController.deleteMessage)

module.exports = router