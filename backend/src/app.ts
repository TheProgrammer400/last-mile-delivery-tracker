import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import ordersRoutes from './routes/orders.routes';
import agentsRoutes from './routes/agents.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS Configuration (supports local dev, Vercel preview, and Vercel production domains)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (Base Path: /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/agents', agentsRoutes);

// Error Handler
app.use(errorHandler);

export default app;
