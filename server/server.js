const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process'); // To execute shell commands
const path = require('path'); // To handle file paths

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

const PORT = process.env.PORT || 8383;

// Serve static files from the "client" directory
app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', (socket) => {
  console.log('Stream Deft client connected:', socket.id);

  // Listen for a custom action from the client
  socket.on('stream-action', (actionId) => {
    console.log(`Action received: ${actionId}`);

    // Here you would define what each actionId does.
    // For now, we'll just log it.
  });

  socket.on('disconnect', () => {
    console.log('Stream Deft client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});