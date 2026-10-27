import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { leaveSchema, leaveStatusSchema } from '../utils/schemas.js';

const router = express.Router();

router.post('/', protect, validate(leaveSchema), applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/', protect, authorize('Admin', 'HR'), getAllLeaves);
router.put('/:leaveId/status', protect, authorize('Admin', 'HR'), validate(leaveStatusSchema), updateLeaveStatus);

export default router;
