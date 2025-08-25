const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { // Permitir conexiones desde cualquier origen
    origin: "*",
  }
});

const PORT = process.env.PORT || 3000;

const players = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // Inicializa al jugador
  players[socket.id] = {
    position: { x: 0, y: 1.5, z: 5 },
    rotation: { x: 0, y: 0, z: 0 }
  };

  // Escucha el movimiento del jugador
  socket.on('playerMove', (data) => {
    players[socket.id] = data;
    // Por ahora, solo lo mostramos en la consola del servidor
    // console.log('Player moved:', socket.id, data);
  });

  // Gestiona la desconexión
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});