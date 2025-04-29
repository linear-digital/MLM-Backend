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
        const limit = req.query.limit || 100
        const page = req.query.page || 1
        const skip = (page - 1) * limit
        const data = {
            limit: parseInt(limit),
            page: parseInt(page),
            skip: parseInt(skip)
        }
        const result = await messageService.chatByUser(req.params.id, data)
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
const searchMessages = async (req, res) => {
    try {
        const result = await messageService.searchMessages(req.query)
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

const seenMessage = async (req, res) => {
    try {
        const result = await messageService.seenMessage(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const getAllMessages = async (req, res) => {
    try {
        const result = await messageService.getAllMessages(req.query)
        res.send(result)
    } catch (error) {
        res.status(500).send({
            message: error.message
        })
    }
}
const updateMessage = async (req, res) => {
    try {
        const result = await messageService.updateMessage(req.params.id, req.body)
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
    deleteMessage,
    markChat,
    seenMessage
}

router.post("/", messageController.createMessage)
router.post("/chat", messageController.createNewChat)

router.put("/chat/:id", markChat)
router.put("/update/:id", updateMessage)
router.put("/seen/:id", seenMessage)
router.get("/chats", messageController.getChats)
router.get("/user/:id", messageController.chatByUser)
router.get("/:id", messageController.getAChat)
router.get("/msg/all", messageController.getMessages)
router.get("/msg/search", searchMessages)
router.get("/all/msg", getAllMessages)
router.delete("/:id", messageController.deleteMessage)


module.exports = router