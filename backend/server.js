import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import rootRoutes from './src/routes/rootRoutes.js';
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swaggerConfig.js';

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Culinary Hub API Docs',
  }));
app.use(rootRoutes);



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