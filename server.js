const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 5000;

app.use(express.static(path.join(__dirname, '../frontend')));

let waitingUser = null;

const userMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('typing', (isTyping) => {
    if (socket.partner) {
      socket.partner.emit('typing', isTyping);
    }
  });

  socket.on('join', (username) => {
    socket.username = username;

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      userMap[socket.id] = waitingUser;
      userMap[waitingUser.id] = socket;

      socket.emit('matched', waitingUser.username);
      waitingUser.emit('matched', socket.username);

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting');
    }
  });

  socket.on('sessionKey', (key) => {
    const partner = userMap[socket.id];
    if (partner) {
      partner.emit('sessionKey', key);
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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

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

http.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
const cors = require("cors");

app.use(cors({
  origin: "https://jadexzc.github.io", // your GitHub Pages frontend
  methods: ["GET", "POST"],
  credentials: true
}));