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
require("./tracing");
// Create HTTP server for Socket.IO
const server = createServer(app);
const allowedOrigins = [
  "http://localhost:4321",
  "http://localhost:4000",
  "https://cnppromo.vercel.app",
  "https://admin.socket.io", // Add this line
  "https://www.cnppromo.com",
  "https://cnppromo.com",
  "https://cnppromo-ba4cdajay-tamizs-projects.vercel.app"
];
const redirectUrl = "https://cnppromo.com";
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
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ['websocket'], // Force WebSocket transport
});

instrument(io, {
  auth: false,
  namespaceName: '/admin',
  namespacePath: '/socket.io',
});
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(null, false); // Prevents a crash
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

// ✅ Middleware to Redirect Unauthorized Origins
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`Redirecting unauthorized origin: ${origin}`);
    // Redirect only for normal browser requests (not for API fetches)
    if (!req.xhr && req.accepts("html")) {
      return res.redirect(307, redirectUrl); // Temporary redirect
    } else {
      return res.status(403).json({ error: "CORS Policy Blocked This Request" });
    }
  }

  next();
});

// ✅ Global Error Handler (Prevents Crashes)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

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
//   try {
//     const result = await Message.updateMany(
//       { image: { $regex: "^https://mlm.genzit.xyz" } }, // Find messages with the old URL
//       [
//         {
//           $set: {
//             image: {
//               $replaceOne: {
//                 input: "$image",
//                 find: "https://mlm.genzit.xyz",
//                 replacement: "https://server.cnppromo.com"
//               }
//             }
//           }
//         }
//       ]
//     );
//     res.send(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       message: error.message,
//     });
//   }
// });
const path = require('path')

app.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "files", filename);

  // Check if the file exists
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send("File not found.");
    }
  });
});

const connectedSockets = new Map();
const sendToSpecificUser = (socketId, data, funname) => {
  if (connectedSockets.has(socketId)) {
    const socket2 = connectedSockets.get(socketId);
    socket2.emit(funname, data);
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

    sendToSpecificUser(data.receiver, result, "message");
    sendToSpecificUser(data.sender, result, "message");
  });

  socket.on('seen', async (data) => {
    const result = await Message.findByIdAndUpdate(data._id, {
      seen: true
    }, {
      new: true
    })
    sendToSpecificUser(data.sender, result, "seen");
  })
  socket.on('seenOnly', async (id) => {
    const chat = await Chat.findById(id)
    if (!chat) {
      throw new Error("Chat not found")
    }
    sendToSpecificUser(chat.owner, {
      message: "seen"
    }, "seen")
    sendToSpecificUser(chat.user, {
      message: "seen"
    }, "seen")
  })
  // Handle disconnections
  socket.on("disconnect", () => {
    statusUpdater(userId, false);
  });
});

// Start the server
server.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
