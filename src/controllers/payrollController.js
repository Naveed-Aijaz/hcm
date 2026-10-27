import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const DEFAULT_DAILY_RATE = Number(process.env.PAYROLL_DEFAULT_DAILY_RATE) || 2000;

// Attendance-based estimate (HR/Admin only). Does not persist anything.
export async function generatePayroll(req, res, next) {
  try {
    const { userId, month, year } = req.body;

    const employee = await User.findById(userId).select('name email salary');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const prefix = `${year}-${String(month).padStart(2, '0')}-`; // validated numbers => safe prefix
    const records = await Attendance.find({
      userId,
      date: { $gte: `${prefix}01`, $lte: `${prefix}31` },
      status: { $in: ['Present', 'Late'] },
    }).select('_id');

    const presentDays = records.length;
    const basic = employee.salary?.basic || 0;
    // If a monthly basic salary is set, pro-rate over 26 working days; otherwise use default daily rate.
    const dailyRate = basic > 0 ? Math.round(basic / 26) : DEFAULT_DAILY_RATE;
    const totalSalary = presentDays * dailyRate + (presentDays > 0 ? employee.salary?.allowances || 0 : 0);

    res.status(200).json({
      success: true,
      data: { userId, name: employee.name, month, year, presentDays, dailyRate, totalSalary },
    });
  } catch (error) {
    next(error);
  }
}
