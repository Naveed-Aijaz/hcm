import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/authRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import leaveRoutes from './src/routes/leaveRoutes.js';
import payrollRoutes from './src/routes/payrollRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import { notFound, errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

// Vercel sits behind a proxy; needed for correct client IPs / rate limiting.
app.set('trust proxy', 1);

// CLIENT_URL = comma separated list of frontend ORIGINS (scheme + host, no path).
const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
// const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
//   .split(',')
//   .map((o) => toOrigin(o.trim()))
//   .filter(Boolean);

// app.disable('x-powered-by');
// app.use(helmet());
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
//       return callback(Object.assign(new Error('Origin not allowed by CORS'), { code: 'CORS_NOT_ALLOWED' }));
//     },
//     credentials: true,
//   })
// );





 const allowedOrigins = ( process.env.CLIENT_URL || 'https://hcml-azure.vercel.app/' ) .split(',') .map((origin) => origin.trim().replace(//+$/, '')) .filter(Boolean);

app.disable('x-powered-by'); app.use(helmet());

app.use( cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) { return callback(null, true); } return callback(new Error('Origin not allowed by CORS')); }, credentials: true, }) );
 


// Check-in photos are base64 JPEGs; Vercel itself caps request bodies at ~4.5 MB.
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'HCM Lite API is running', timestamp: new Date().toISOString() });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
