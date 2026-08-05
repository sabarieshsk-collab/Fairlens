const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, unreadOnly } = req.query;
    
    const query = { company: req.company.companyId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      company: req.company.companyId, 
      read: false 
    });
    
    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: parseInt(skip) + notifications.length < total,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      company: req.company.companyId, 
      read: false 
    });
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, company: req.company.companyId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { company: req.company.companyId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      company: req.company.companyId,
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.createNotification = async (companyId, type, title, message, data = {}, priority = 'medium') => {
  try {
    const notification = await Notification.create({
      company: companyId,
      type,
      title,
      message,
      data,
      priority,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};