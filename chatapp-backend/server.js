const express = require("express");
const {chats} = require("./data/data")
const cors = require("cors")
const dotenv = require("dotenv")
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const connectDB = require("./config/db");
const {notFound,errorHandler} = require('./middleware/errorMiddleware')
const messageRoutes = require("./routes/messageRoutes")
const path = require('path')
const BASE_URL = process.env.BASE_URL

dotenv.config();
connectDB();
const app = express();
app.use(express.json());
const corsOptions = {
  origin: 'https://chat-fullstack-ov7q.onrender.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}; // to accept json data
app.use(cors(corsOptions));



// app.get('/',(req,res) =>{
//     res.send("Api is running")
// });

app.use("/api/user", userRoutes);
app.use("/api/chat",chatRoutes);
app.use("/api/message",messageRoutes);

// -----------------DEPLOYMENT----------------------

const __dirname1 = path.resolve(); // Resolves to 'project-root'

// Serve static files from 'frontend/build'
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, 'frontend', 'build')));

  // Serve index.html for any route in production
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'frontend', 'build', 'index.html'));
  });
} else {
  // In development mode, handle other routes or provide a simple response
  app.get('/', (req, res) => {
    res.send('API is running..');
  });
}
//  ------------------------------------

app.get("/", (req, res) => {
  res.send("API is running..");
});

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT;

const server = app.listen(PORT,console.log(`serveris running on port ${PORT}`))

const io = require('socket.io')(server,{
    pingTimeout:6000,
    cors:{
      origin: "*",
      credentials: true
    },
});

io.on("connection",(socket) =>{
    console.log("connected to socket.io");
    socket.on('setup',(userData) =>{
     socket.join(userData._id);
    console.log(userData._id);
     socket.emit("Connected");
    });
    socket.on('join chat',(room)=>{
        socket.join(room);
        console.log("user Joined Room:"+ room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  

    socket.on('new message',(newMessageRecieved) =>{
        var chat = newMessageRecieved.chat;
        if(!chat.users) return console.log("Chat.users is not defined")
        chat.users.forEach(user =>{
            if(user._id == newMessageRecieved.sender._id)
            return;
            socket.in(user._id).emit("message recieved",newMessageRecieved);
        });
    });
});



