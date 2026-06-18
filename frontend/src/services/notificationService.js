// src/services/notificationService.js
import api from "./api";

// Get all notifications for logged-in user
export const getNotifications = () => api.get("/notifications");

// Mark a single notification as read
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

// ADDED: Mark all notifications as read
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");

export default { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead // ADDED
};