const express = require("express");
const { chats } = require("./data/data");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const messageRoutes = require("./routes/messageRoutes");
const path = require('path');
const BASE_URL = process.env.BASE_URL;

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'https://chat-fullstack-ov7q.onrender.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

if (process.env.NODE_ENV === 'production') {
  const __dirname1 = path.resolve();
  app.use(express.static(path.join(__dirname1, 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running..');
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(PORT, console.log(`Server is running on port ${PORT}`));

const io = require('socket.io')(server, {
  pingTimeout: 6000,
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

io.on("connection", (socket) => {
  console.log("Connected to Socket.IO");

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on('new message', (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat.users) return console.log("Chat.users is not defined");

    chat.users.forEach(user => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });
});
