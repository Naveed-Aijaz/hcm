import express from 'express';
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayBoard,
} from '../controllers/attendanceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/my-logs', protect, getMyAttendance);
router.get('/today', protect, authorize('Admin', 'HR'), getTodayBoard);

export default router;
