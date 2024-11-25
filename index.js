const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createServer } = require("http"); // Import HTTP server
const { Server } = require("socket.io"); // Import Socket.IO server
const connectDB = require("./util/mongodb");
const getSetting = require("./Routes/Settings/getSetting");
const authChecker = require("./util/authChecker");
const updateSetting = require("./Routes/Settings/updateSetting");
const User = require("./Routes/User/user.model");
const Withdraw = require("./Routes/WithDraw/withdraw.model");
const Message = require("./Routes/message/message.model");
const { createMessage } = require("./Routes/message/message.service");
const Chat = require("./Routes/message/chat.model");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server for Socket.IO
const server = createServer(app);

// Set up Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins or specify your front-end URL
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect MongoDB
connectDB();

// Routes
app.use('/api/v1', require('./Routes/index'));
app.get('/', (req, res) => {
    res.send({
        message: "Server Is Running",
    });
});

// Get site settings
app.get('/api/v1/setting', async (req, res) => {
    try {
        const response = await getSetting();
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
});

// Statistics route
app.get('/api/v1/statistic', async (req, res) => {
    try {
        const total = await User.countDocuments();
        const active = await User.countDocuments({ status: "active" });
        const pending = await User.countDocuments({ status: "pending" });
        const blocked = await User.countDocuments({ lock: true });
        const total_withdraw = await Withdraw.find({ status: "completed" });
        const totalAmmount = total_withdraw
            .map(withdraw => withdraw.amount)
            .reduce((a, b) => a + b, 0);
        res.send({
            total: 32000 + total,
            active: 30001 + active,
            pending,
            blocked,
            total_withdraw: totalAmmount,
        });
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
});

// Update settings
app.put('/api/v1/setting', authChecker, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(400).send({
                message: "Who are you pokinni",
            });
        }
        const response = await updateSetting(req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
});

const connectedSockets = new Map();
const sendToSpecificUser = (socketId, data) => {
    console.log(socketId);
    if (connectedSockets.has(socketId)) {
        const socket2 = connectedSockets.get(socketId);
        socket2.emit("message", data);
    }
    else {
        console.log("User not found", socketId);
    }

};
// Listen for Socket.IO connections
io.on("connection", (socket) => {
    socket.id = socket.handshake.query.user
    connectedSockets.set(socket.id, socket);
    const msf = {
        message: "Hello",
        receiver: "6744dca88af50aaf008eae99",
        sender: "6692b4224d24dd0065d7a93b",
        chat: "6744dce38af50aaf008eaf07"
    }
    // Handle events
    socket.on("message", async (data) => {
        const result = await createMessage(data);
    
        sendToSpecificUser(data.receiver, result)
        sendToSpecificUser(data.sender, result)
    });

    // Handle disconnections
    socket.on("disconnect", () => {
        // console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));