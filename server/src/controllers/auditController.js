import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { category, action, search, limit = 50 } = req.query;
    const query = {};

    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (action) {
      query.action = action;
    }
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    next(err);
  }
};
