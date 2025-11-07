import express from 'express';
import locationRoutes from '../routes/locations.js';
import authRoutes from '../routes/auth.js';
import dishRoutes from '../routes/Dish.js';
const router = express.Router();
router.use('/api/locations', locationRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/dish',dishRoutes)


export default router;  