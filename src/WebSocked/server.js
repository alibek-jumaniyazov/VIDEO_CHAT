import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Frontend manzili
    methods: ['GET', 'POST'],
  },
});

let connectedUsers = []; // Ulangan foydalanuvchilarni saqlash

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Foydalanuvchini ro‘yxatga qo‘shish
  connectedUsers.push(socket.id);

  // Tasodifiy foydalanuvchini ulash
  socket.on('find_match', () => {
    const otherUsers = connectedUsers.filter((id) => id !== socket.id);
    if (otherUsers.length > 0) {
      const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      socket.emit('match_found', randomUser);
      io.to(randomUser).emit('match_found', socket.id);
    } else {
      socket.emit('no_users');
    }
  });

  // Ulashni to‘xtatish
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers = connectedUsers.filter((id) => id !== socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
