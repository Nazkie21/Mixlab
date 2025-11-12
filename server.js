import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

//  IMPORTS - Routes
import authRouter from './routes/authRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import quizAttemptRoutes from './routes/quizAttemptRoutes.js';
import xpRoutes from './routes/xpRoutes.js';
import modulesRoutes from './routes/modulesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';

// IMPORTS - Middleware
import { authenticateToken } from './middleware/authMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'; //error handling 

dotenv.config();

const app = express();

// GLOBAL MIDDLEWARES
app.use(express.json());
app.use(cookieParser());
// CORS: allow specific client origins (add Live Server origin used during frontend dev)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5500',
  'http://localhost:5501',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests (like curl, or same-origin requests from tools)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Origin not allowed'), false);
    },
    credentials: true,
  })
);

// Serve frontend files from "public" folder
app.use(express.static('public'));

// Serve Landing frontend (maps to http://localhost:3000/Landing)
app.use('/Landing', express.static(path.join(process.cwd(), 'frontend', 'Landing')));

// Serve login frontend (maps to http://localhost:3000/login)
app.use('/login', express.static(path.join(process.cwd(), 'frontend', 'login')));

// Serve Admin frontend directly for convenience (maps to http://localhost:3000/admin)
app.use('/admin', express.static(path.join(process.cwd(), 'frontend', 'Admin')));

// BASE ROUTES
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Base API prefix
const API_BASE = '/api';

// AUTH ROUTES
app.use(`${API_BASE}/auth`, authRouter);

//  LESSON ROUTES
app.use(`${API_BASE}/lessons`, lessonRoutes);

//  QUIZ ROUTES
app.use(`${API_BASE}/quizzes`, quizRoutes);
app.use(`${API_BASE}/quiz-attempts`, quizAttemptRoutes);

//  XP & BADGES ROUTES
app.use(`${API_BASE}/users`, xpRoutes);
app.use(`${API_BASE}/badges`, badgeRoutes);

// MODULES ROUTES
app.use(`${API_BASE}/modules`, modulesRoutes);

// USER ROUTES
app.use(`${API_BASE}/users`, userRoutes);

// BOOKING ROUTES
app.use(`${API_BASE}/bookings`, bookingRoutes);

// NOTIFICATION ROUTES
app.use(`${API_BASE}/notifications`, notificationRoutes);

// ANALYTICS ROUTES
app.use(`${API_BASE}/analytics`, analyticsRoutes);

// ADMIN ROUTES NEW
app.use(`${API_BASE}/admin`, adminRoutes);

// PROTECTED USER ROUTE
app.get(`${API_BASE}/profile`, authenticateToken, (req, res) => {
  res.json({ message: 'This is protected', user: req.user });
});

app.use(notFoundHandler);
app.use(errorHandler);




//  START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`

Server: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
API Base: http://localhost:${PORT}/api

Middleware: CORS, Auth, Guest Tracking
Database: MySQL Connected

  `);
});