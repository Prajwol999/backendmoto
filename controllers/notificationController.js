const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/user/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    // We get req.user._id from your authentication middleware
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching notifications.' });
  }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   PUT /api/user/notifications/mark-read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating notifications.' });
  }
};