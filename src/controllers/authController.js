import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const isProd = () => process.env.NODE_ENV === 'production';

// Frontend and API are on different Vercel domains in production => SameSite=None; Secure.
const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'none' : 'lax',
  path: '/',
});

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN_SESSION || '7d',
    algorithm: 'HS256',
  });
  res.cookie('token', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    department: user.department,
    designation: user.designation,
  };
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, company } = req.body;

    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Only the very first account becomes Admin. Everyone else is an Employee;
    // Admin/HR accounts are created by an Admin via POST /api/users.
    const isFirst = (await User.estimatedDocumentCount()) === 0;
    const role = isFirst ? 'Admin' : 'Employee';

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      company,
    });

    setAuthCookie(res, user);
    return res.status(201).json({
      success: true,
      user: safeUser(user),
      message: isFirst ? 'First Admin account created' : 'Account created',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    setAuthCookie(res, user);
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ success: true, user: safeUser(req.user) });
}

export function logout(_req, res) {
  res.clearCookie('token', cookieOptions());
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}
