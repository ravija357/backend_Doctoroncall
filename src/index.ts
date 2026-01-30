import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './app/routes/auth.routes';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true, // 🔥 REQUIRED
  })
);

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

app.get('/health', (req, res) => {
  res.json({
    status: 'Sprint 4 Backend API Ready ✅',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
