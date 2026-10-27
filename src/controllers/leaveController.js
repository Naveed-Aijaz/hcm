import Leave from '../models/Leave.js';

export async function applyLeave(req, res, next) {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({ userId: req.user._id, leaveType, startDate, endDate, reason, status: 'Pending' });
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function getMyLeaves(req, res, next) {
  try {
    const leaves = await Leave.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
}

// HR/Admin: all requests, optionally filtered by ?status=Pending
export async function getAllLeaves(req, res, next) {
  try {
    const filter = {};
    if (['Pending', 'Approved', 'Rejected'].includes(req.query.status)) filter.status = req.query.status;
    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('userId', 'name email department');
    res.json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveStatus(req, res, next) {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (leave.userId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You cannot approve or reject your own leave request' });
    }
    // Atomic transition: only a Pending request can be decided (no double-decisions)
    const updated = await Leave.findOneAndUpdate(
      { _id: leave._id, status: 'Pending' },
      { $set: { status } },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ success: false, message: `Request already ${leave.status.toLowerCase()}` });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
