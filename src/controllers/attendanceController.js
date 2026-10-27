import Attendance from '../models/Attendance.js';
import { officeParts } from '../utils/time.js';

const OFFICE_START_HOUR = Number(process.env.OFFICE_START_HOUR) || 9;
const GRACE_MINUTES = Number(process.env.OFFICE_GRACE_MINUTES) || 15;
const MAX_PHOTO_CHARS = 2_500_000; // ~1.8 MB of image data as base64

function calcStatus(minutes) {
  return minutes > OFFICE_START_HOUR * 60 + GRACE_MINUTES ? 'Late' : 'Present';
}

function cleanLocation(loc) {
  if (!loc || typeof loc !== 'object') return undefined;
  const lat = Number(loc.lat), lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  const accuracy = Number(loc.accuracy);
  return { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : undefined };
}

export async function checkIn(req, res, next) {
  try {
    const { photo, location } = req.body || {};
    if (photo !== undefined && photo !== null && photo !== '') {
      if (typeof photo !== 'string' || !/^data:image\/(jpeg|png);base64,/.test(photo) || photo.length > MAX_PHOTO_CHARS) {
        return res.status(400).json({ success: false, message: 'Invalid or oversized photo' });
      }
    }

    const now = new Date();
    const { date, minutes } = officeParts(now);
    const status = calcStatus(minutes);

    const attendance = await Attendance.create({
      userId: req.user._id,
      date,
      checkInTime: now,
      status,
      checkInPhoto: photo || '',
      source: photo ? 'camera' : 'web',
      location: cleanLocation(location),
    });

    res.status(201).json({ success: true, data: attendance, message: `Check-in successful (${status})` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already checked in today' });
    }
    next(error);
  }
}

export async function checkOut(req, res, next) {
  try {
    const { date } = officeParts();
    // Atomic: only sets checkOutTime if not already set (prevents double check-out races)
    const attendance = await Attendance.findOneAndUpdate(
      { userId: req.user._id, date, checkInTime: { $exists: true }, checkOutTime: { $exists: false } },
      { $set: { checkOutTime: new Date() } },
      { new: true }
    );

    if (!attendance) {
      const existing = await Attendance.findOne({ userId: req.user._id, date });
      if (!existing) return res.status(404).json({ success: false, message: 'No check-in found for today' });
      return res.status(409).json({ success: false, message: 'You have already checked out today' });
    }
    res.json({ success: true, data: attendance, message: 'Check-out successful' });
  } catch (error) {
    next(error);
  }
}

export async function getMyAttendance(req, res, next) {
  try {
    const logs = await Attendance.find({ userId: req.user._id }).sort({ date: -1 }).limit(60);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

// HR/Admin only (enforced in routes). Photos are excluded to keep responses small.
export async function getTodayBoard(_req, res, next) {
  try {
    const { date } = officeParts();
    const records = await Attendance.find({ date })
      .select('-checkInPhoto')
      .populate('userId', 'name email department role');
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
}
