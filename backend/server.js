import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './db.js';

// Route Imports
import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';
import paymentRouter from './routes/payment.js';
import aiRouter from './routes/ai.js';
import usageRouter from './routes/usage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/ai', aiRouter);
app.use('/api/usage', usageRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Self Ranker API Server is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
