import express from 'express';
import { signup, login, me, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { signupSchema, loginSchema } from '../utils/schemas.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.post('/logout', logout);

export default router;
