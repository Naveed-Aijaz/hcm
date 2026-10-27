// Vercel serverless entry point. vercel.json rewrites every /api/* request here.
import app from '../app.js';
import connectDB from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('API initialization failed:', error.message);
    return res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
  }
  return app(req, res);
}
