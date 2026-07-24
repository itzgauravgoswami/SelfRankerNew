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

// CORS Configuration
const allowedOrigins = [
  FRONTEND_URL,
  'https://selfrankernew.vercel.app',
  'https://www.selfrankernew.vercel.app',
  'https://selfrankernew.gauravgoswami.me',
  'https://www.selfrankernew.gauravgoswami.me',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('https://selfrankernew-');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false); // Block CORS by returning false without throwing uncaught server exception
    }
  },
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware before Helmet to resolve preflight requests correctly
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Middleware (relax CORP to permit cross-origin access by frontend)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
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
