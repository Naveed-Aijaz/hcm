import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Admin/HR: employee directory with search + pagination. Never returns password/photo.
export async function getAllUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 50)), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { department: rx }];
    }
    if (['Admin', 'HR', 'Employee'].includes(req.query.role)) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -profilePicture -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: users, page, limit, total });
  } catch (error) {
    next(error);
  }
}

// Admin: any role. HR: Employee accounts only.
export async function createUser(req, res, next) {
  try {
    const { name, email, password, role, department, designation, salary } = req.body;
    if (req.user.role === 'HR' && role !== 'Employee') {
      return res.status(403).json({ success: false, message: 'HR can only create Employee accounts' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({
      name, email, role, department, designation, salary,
      password: await bcrypt.hash(password, 12),
      company: req.user.company,
      mustChangePassword: true,
    });
    const obj = user.toObject();
    delete obj.password;
    res.status(201).json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
}

// Admin only (enforced in routes). Cannot demote/deactivate yourself.
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    if (id === req.user._id.toString() && (req.body.role !== undefined || req.body.isActive !== undefined)) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role or status' });
    }
    const user = await User.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true })
      .select('-password -profilePicture');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// Update own profile or avatar
export async function updateProfile(req, res, next) {
  try {
    const updateData = {};
    for (const key of ['name', 'department', 'company', 'phone', 'address']) {
      const v = req.body?.[key];
      if (typeof v === 'string' && v.trim().length <= 200) updateData[key] = v.trim();
    }
    if (updateData.name !== undefined && updateData.name.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    if (req.file) {
      // Stored as a data URL in MongoDB: Vercel has no persistent disk.
      updateData.profilePicture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const updated = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true })
      .select('-password');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
