import express from 'express';
import { generatePayroll } from '../controllers/payrollController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { payrollSchema } from '../utils/schemas.js';

const router = express.Router();

router.post('/generate', protect, authorize('Admin', 'HR'), validate(payrollSchema), generatePayroll);

export default router;
