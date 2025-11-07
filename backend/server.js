import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import rootRoutes from './src/routes/rootRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swaggerConfig.js';
import { initializeSocket } from './src/socket/index.js';
import mediasoupServer from './src/webrtc/index.js';
import compression from 'compression';
import helmet from 'helmet';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || "*",
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Culinary Hub API Docs',
}));

// Routes
app.use(rootRoutes);

// Initialize MediaSoup WebRTC server
mediasoupServer.initialize()
  .then(() => {
    console.log('✅ MediaSoup WebRTC server initialized');
    
    // Initialize Socket.io
    const io = initializeSocket(server);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for livestream`);
      console.log(`🎥 WebRTC (MediaSoup) ready for video streaming`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize MediaSoup:', err);
    process.exit(1);
  });