require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://jadexzc.github.io", // ✅ Make sure this matches your GitHub Pages domain
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Static files (optional if serving static frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection (if you plan to store chat history)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Matchmaking logic
let waitingUser = null;
const userMap = {};

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('join', (username) => {
    socket.username = username;

    if (waitingUser) {
      // Match with waiting user
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      userMap[socket.id] = waitingUser;
      userMap[waitingUser.id] = socket;

      socket.emit('matched', waitingUser.username);
      waitingUser.emit('matched', socket.username);

      waitingUser = null;
    } else {
      // Wait for next user
      waitingUser = socket;
      socket.emit('waiting');
    }
  });

  socket.on('typing', (isTyping) => {
    if (socket.partner) {
      socket.partner.emit('typing', isTyping);
    }
  });

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', {
        from: socket.username,
        text: msg,
      });
    }
  });

  socket.on('sessionKey', (key) => {
    const partner = userMap[socket.id];
    if (partner) {
      partner.emit('sessionKey', key);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (socket.partner) {
      socket.partner.emit('partnerDisconnected');
      socket.partner.partner = null;
      delete userMap[socket.id];
      delete userMap[socket.partner.id];
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
