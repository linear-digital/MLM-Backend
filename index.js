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
const Refer = require("./Routes/Refer/refer.model");
require("dotenv").config();
const { instrument } = require("@socket.io/admin-ui");
const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server for Socket.IO
const server = createServer(app);
const allowedOrigins = [
  "http://localhost:4321",
  "https://cnppromo.vercel.app",
  "https://admin.socket.io", // Add this line
  "https://www.cnppromo.com"
];
// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} is not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  transports: ['websocket'], // Force WebSocket transport
});

instrument(io, {
  auth: false,
  namespaceName: '/admin',
  namespacePath: '/socket.io',
});
// Middleware
app.use(cors(
  {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} is not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
  }
));
app.use(bodyParser.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/v1", require("./Routes/index"));
app.get("/", (req, res) => {
  res.send({
    message: "Server Is Running",
  });
});

// Get site settings
app.get("/api/v1/setting", async (req, res) => {
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
app.get("/api/v1/statistic", async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: "active" });
    const pending = await User.countDocuments({ status: "pending" });
    const blocked = await User.countDocuments({ lock: true });
    const total_withdraw = await Withdraw.find({ status: "completed" });
    const totalAmmount = total_withdraw
      .map((withdraw) => withdraw.amount)
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
app.put("/api/v1/setting", authChecker, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(400).send({
        message: "Who are you pokinni",
      });
    }
    const response = await updateSetting(req.body);
    res.send(response);
  } catch (error) {
    res.sendStatus(500).send({
      message: error.message,
    });
  }
});

// app.get('/update', async (req, res) => {
//     try {
//         const users = await User.find(); // Get all user documents
//         const totalUsers = users.length;

//         const result = await Promise.all(
//             users.map(async (user, index) => {
//                 const countRefer = await Refer.countDocuments({ reffer: user._id, gen: 1 });
//                 const level = countRefer > 160 ? 3 : countRefer > 40 ? 2 : 1;

//                 await User.findByIdAndUpdate(user._id, { level }, { new: true });
//                 return `${index + 1}/${totalUsers}`;
//             })
//         );

//         res.send({
//             message: `Updated ${result.length} users successfully.`,
//             details: result,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({
//             message: error.message,
//         });
//     }
// });

const connectedSockets = new Map();
const sendToSpecificUser = (socketId, data) => {
  if (connectedSockets.has(socketId)) {
    const socket2 = connectedSockets.get(socketId);
    socket2.emit("message", data);
  } else {
    console.log("User not found", socketId);
  }
};
io.use(async (socket, next) => {
  try {
    const userId = socket.handshake.query.user;
    if (!userId) {
      return next(new Error("Authentication error"));
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new Error("User not found"));
    }
    socket.user = user;
    socket.id = userId;
    next();
  } catch (error) {
    next(error);
  }
});
const statusUpdater = async (socketId, status) => {
  try {
    const result = await User.findByIdAndUpdate(
      socketId,
      { active: status, lastActive: Date.now() },
      { new: true }
    );
    if (!result) {
      console.log("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

// Listen for Socket.IO connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.user;
  socket.id = userId;
  connectedSockets.set(socket.id, socket);
  statusUpdater(userId, true);

  // Handle events
  socket.on("message", async (data) => {
    const result = await createMessage(data);

    sendToSpecificUser(data.receiver, result);
    sendToSpecificUser(data.sender, result);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    statusUpdater(userId, false);
  });
});

// Start the server
server.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
