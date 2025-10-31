const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Simple in-memory message history (kept small)
const MESSAGE_HISTORY_LIMIT = 200;
const messages = [];

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // send recent history
  socket.emit('history', messages);

  socket.on('join', (username) => {
    socket.data.username = username || 'Anonymous';
    socket.broadcast.emit('system', `${socket.data.username} joined the chat`);
  });

  socket.on('message', (msg) => {
    const message = {
      id: Date.now() + Math.random().toString(36).slice(2, 9),
      user: socket.data.username || 'Anonymous',
      text: msg,
      time: new Date().toISOString(),
    };

    messages.push(message);
    if (messages.length > MESSAGE_HISTORY_LIMIT) messages.shift();

    io.emit('message', message);
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { user: socket.data.username || 'Anonymous', isTyping });
  });

  socket.on('disconnect', () => {
    if (socket.data.username) {
      socket.broadcast.emit('system', `${socket.data.username} left the chat`);
    }
    console.log('socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
// bind host (0.0.0.0 is safe for containers / cloud hosts)
const HOST = process.env.HOST || '0.0.0.0';

// Serve static client
app.use(express.static(path.join(__dirname, 'public')));

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server listening on port ${PORT}`);
  if (!process.env.PORT) {
    console.log(`Local: http://localhost:${PORT}`);
  } else {
    console.log('Running with environment PORT. Use your deployment URL to access the app.');
  }
});
