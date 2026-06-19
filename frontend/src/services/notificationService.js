import api from "./api";

// Get all notifications for logged-in user
export const getNotifications = async () => {
  try {
    const res = await api.get("/notifications");
    console.log("Notifications API response:", res.data);
    // Handle both response formats
    if (res.data && res.data.notifications) {
      return res.data;
    }
    return { data: res.data || [] };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Mark a single notification as read
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

// Mark all notifications as read
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");

export default { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead
};