import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Fake foydalanuvchilar (id, name, password)
const fakeUsers = [
  { id: 1, name: 'User 1', password: 'pass1' },
  { id: 2, name: 'User 2', password: 'pass2' },
  { id: 3, name: 'User 3', password: 'pass3' },
  { id: 4, name: 'User 4', password: 'pass4' },
  { id: 5, name: 'User 5', password: 'pass5' },
];

let connectedUsers = {}; // { socketId: { id, name } }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Login event
  socket.on('login', ({ userId, password }, callback) => {
    const user = fakeUsers.find((u) => u.id === userId && u.password === password);
    if (user) {
      connectedUsers[socket.id] = { id: user.id, name: user.name };
      console.log(`${user.name} logged in`);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Invalid login credentials' });
    }
  });

  // Tasodifiy foydalanuvchi topish
  socket.on('find_match', () => {
    const otherUsers = Object.keys(connectedUsers).filter((id) => id !== socket.id);
    if (otherUsers.length > 0) {
      const randomSocketId = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      socket.emit('match_found', connectedUsers[randomSocketId]);
      io.to(randomSocketId).emit('match_found', connectedUsers[socket.id]);
    } else {
      socket.emit('no_users');
    }
  });

  // Ulanishni tugatish
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete connectedUsers[socket.id];
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
