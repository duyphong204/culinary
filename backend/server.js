require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const locationRoutes = require('./src/routes/locations');
const authRoutes = require('./src/routes/auth');
const dishRoutes = require('./src/routes/Dish')
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/locations', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dish',dishRoutes)

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-stream', (room) => {
    socket.join(room);
    socket.to(room).emit('user-joined', socket.id);
    console.log(`User ${socket.id} joined room ${room}`);
  });
  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});