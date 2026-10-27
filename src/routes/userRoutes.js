import express from 'express';
import { getAllUsers, createUser, updateUser, updateProfile } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import { createUserSchema, updateUserSchema } from '../utils/schemas.js';

const router = express.Router();

router.get('/', protect, authorize('Admin', 'HR'), getAllUsers);
router.post('/', protect, authorize('Admin', 'HR'), validate(createUserSchema), createUser);
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);
router.put('/:id', protect, authorize('Admin'), validate(updateUserSchema), updateUser);

export default router;
