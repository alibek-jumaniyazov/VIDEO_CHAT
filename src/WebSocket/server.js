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
let waitingUsers = []; // Users waiting for a match

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
    const currentUser = connectedUsers[socket.id];
    if (!currentUser) {
      socket.emit('error', { message: 'Please login first' });
      return;
    }

    // Remove user from waiting list if already there
    waitingUsers = waitingUsers.filter(id => id !== socket.id);
    
    // Find another waiting user
    if (waitingUsers.length > 0) {
      const matchedSocketId = waitingUsers.shift();
      const matchedUser = connectedUsers[matchedSocketId];
      
      if (matchedUser) {
        // Notify both users about the match
        socket.emit('match_found', { user: matchedUser, role: 'caller' });
        io.to(matchedSocketId).emit('match_found', { user: currentUser, role: 'receiver' });
        console.log(`Match found: ${currentUser.name} <-> ${matchedUser.name}`);
      } else {
        // If matched user is no longer connected, add current user to waiting
        waitingUsers.push(socket.id);
        socket.emit('waiting_for_match');
      }
    } else {
      // Add to waiting list
      waitingUsers.push(socket.id);
      socket.emit('waiting_for_match');
      console.log(`${currentUser.name} is waiting for a match`);
    }
  });

  // WebRTC Signaling Events
  socket.on('offer', ({ offer, to }) => {
    console.log('Relaying offer from', socket.id, 'to', to);
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    console.log('Relaying answer from', socket.id, 'to', to);
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('candidate', ({ candidate, to }) => {
    console.log('Relaying ICE candidate from', socket.id, 'to', to);
    socket.to(to).emit('candidate', { candidate, from: socket.id });
  });

  // End call event
  socket.on('end_call', ({ to }) => {
    if (to) {
      socket.to(to).emit('call_ended');
    }
  });

  // Ulanishni tugatish
  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    console.log('User disconnected:', user ? user.name : socket.id);
    
    // Remove from waiting list
    waitingUsers = waitingUsers.filter(id => id !== socket.id);
    
    // Remove from connected users
    delete connectedUsers[socket.id];
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
  console.log('Available users:');
  fakeUsers.forEach(user => {
    console.log(`- ${user.name}: password = ${user.password}`);
  });
});
