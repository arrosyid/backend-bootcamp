import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import taskRoutes from './taskRoutes.js';
import fileRoutes from './fileRoutes.js';
import miscRoutes from './miscRoutes.js';

const router = express.Router();

// Mount specific routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/files', fileRoutes);

// Mount miscellaneous routes at the base of /api/v1
router.use('/', miscRoutes);

export default router;
