// backend/routes/notificationRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import { 
  getNotifications, 
  getUnreadCount,
  markRead, 
  markAllRead,
  deleteNotification,
  deleteAllRead
} from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications
router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount); // NEW: Get unread count

// Mark as read
router.patch("/read-all", auth, markAllRead);
router.patch("/:id/read", auth, markRead);

// Delete notifications
router.delete("/:id", auth, deleteNotification); // NEW: Delete single notification
router.delete("/read-all", auth, deleteAllRead); // NEW: Delete all read notifications

export default router;