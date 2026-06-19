import Notification from "../models/Notification.js";

/**
 * Get notifications for logged-in user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const filter = { user: userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });
    
    // Return in a consistent format
    res.json({
      notifications: notifications,
      pagination: {
        total,
        unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

export const markRead = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ msg: "Not found" });
    if (String(n.user) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    n.read = true;
    await n.save();
    res.json(n);
  } catch (err) {
    console.error("markRead:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ 
      msg: "All notifications marked as read.",
      modifiedCount: result.modifiedCount || 0
    });
  } catch (err) {
    console.error("markAllRead:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ msg: "Not found" });
    if (String(n.user) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    await n.deleteOne();
    res.json({ msg: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

export const deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id,
      read: true
    });
    res.json({ 
      msg: "All read notifications deleted",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("deleteAllRead:", err);
    res.status(500).json({ error: "Failed to delete read notifications" });
  }
};