const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Message = require("./Models/Message/Message.Model");

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
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("sendMessage", async (messageData) => {
    const { senderId, receiverId, content } = messageData;

    // Lưu tin nhắn vào cơ sở dữ liệu
    try {
      const message = new Message({ senderId, receiverId, content });
      await message.save();

      // Phát tin nhắn tới người nhận
      io.to(receiverId).emit("receiveMessage", {
        senderName: messageData.senderName,
        content,
      });
    } catch (error) {
      console.error("Lỗi khi lưu tin nhắn:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
