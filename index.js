const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Message = require("./Models/Message/Message.Model");
const User = require("./Models/User/User.Model");
const mongoose = require("mongoose");
require("./cron/updateRestaurantState");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:3001"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

const port = 3001;
const cors = require("cors");
const dbConnect = require("./Config/dbconnect");
const route = require("./Router");

dbConnect();

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3001"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sử dụng route từ router/index.js
route(app);

// Xử lý kết nối Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication token is required."));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.userId = decoded.userId; // Lưu userId vào socket
    next();
  } catch (err) {
    return next(new Error("Invalid token."));
  }
});

// Socket.IO logic
io.on("connection", async (socket) => {
  const userId = socket.userId;

  try {
    // Lấy thông tin người dùng từ userId
    const user = await User.findById(userId);

    if (user.ROLE.ADMIN || user.ROLE.STAFF) {
      socket.join("admins");
    }

    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("sendMessage", async (messageData) => {
      let { senderId, receiverId, content, senderName } = messageData;

      try {
        if (receiverId === "admin") {
          const message = new Message({
            senderId: new mongoose.Types.ObjectId(senderId),
            receiverId: null,
            content,
          });
          await message.save();

          io.to("admins").emit("receiveMessage", {
            senderId,
            receiverId: "admin",
            content,
            senderName,
            createdAt: message.createdAt,
          });
        } else {
          // Nếu receiverId không phải là "admin", gửi tin nhắn bình thường
          const message = new Message({
            senderId: new mongoose.Types.ObjectId(senderId),
            receiverId: new mongoose.Types.ObjectId(receiverId),
            content,
          });
          await message.save();

          // Gửi tin nhắn tới người nhận và người gửi
          io.to(receiverId.toString()).emit("receiveMessage", {
            senderId,
            receiverId,
            content,
            senderName,
            createdAt: message.createdAt,
          });
          io.to(senderId).emit("receiveMessage", {
            senderId,
            receiverId,
            content,
            senderName,
            createdAt: message.createdAt,
          });
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  } catch (error) {
    console.error("Error connecting user:", error);
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
