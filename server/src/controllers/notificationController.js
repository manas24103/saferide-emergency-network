import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = unreadOnly === 'true' ? { read: false } : {};

    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};
