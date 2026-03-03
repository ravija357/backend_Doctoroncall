import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { connectDB } from './config/db';
import { AppError } from './app/utils/AppError';
import { globalErrorHandler } from './app/middlewares/error.middleware';

import uploadRoutes from './app/routes/upload.routes';
import authRoutes from './app/routes/auth.routes';
import adminRoutes from './app/routes/admin.routes';
import doctorRoutes from './app/routes/doctor.routes';
import availabilityRoutes from './app/routes/availability.routes';
import appointmentRoutes from './app/routes/appointment.routes';
import reviewRoutes from './app/routes/review.routes';
import historyRoutes from './app/routes/medical-history.routes';
import messageRoutes from './app/routes/message.routes';
import notificationRoutes from './app/routes/notification.routes';

import http from 'http';
import { Server } from 'socket.io';
import { initializeSocket } from './app/socket/socket.controller';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://10.1.7.250:3000', 'http://192.168.1.67:3000', 'http://Ravis-MacBook-Air.local:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket Logic
initializeSocket(io);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://10.1.7.250:3000',
  'http://192.168.1.67:3000',
  'http://Ravis-MacBook-Air.local:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Alternatively, you could just allow all origins for dev by returning true
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from public/uploads directory
// Serve static files from public/uploads directory
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Database Connection
connectDB();

// Routes
app.get('/health', (_req, res) => {
  res.json({
    status: 'Doctor Booking System Backend API Ready ✅',
    env: env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/medical-history', historyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/upload', uploadRoutes);



// Global Error Handler
app.all('*', (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

server.listen(Number(env.PORT), '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://Ravis-MacBook-Air.local:${env.PORT}`);
});
