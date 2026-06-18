// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";

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
    
    const notes = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });
    
    res.json({
      notifications: notes,
      pagination: {
        total,
        unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
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
    res.status(500).send("Server Error");
  }
};

/**
 * Mark all notifications as read for the logged-in user
 * PATCH /api/notifications/read-all
 */
export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ 
      msg: "All notifications marked as read.",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("markAllRead:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
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
    res.status(500).send("Server Error");
  }
};

/**
 * Delete all read notifications
 * DELETE /api/notifications/read-all
 */
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
    res.status(500).send("Server Error");
  }
};