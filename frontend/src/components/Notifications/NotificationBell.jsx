import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import notificationService from "../../services/notificationService";
import { FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  useEffect(() => {
    let mounted = true;
    
    const loadNotifications = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }
        const res = await notificationService.getNotifications();
        if (!mounted) return;
        
        let data = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) {
            data = res.data;
          } else if (res.data.notifications) {
            data = res.data.notifications;
          } else if (res.data.data) {
            data = res.data.data;
          }
        }
        
        setNotifications(data);
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log("Notifications loaded:", data.length, "unread:", unread);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();

    if (!user) return;
    const userId = user._id || user.id;
    const s = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
      console.log("Socket connected, registering user:", userId);
      s.emit("register", { userId });
    });

    s.on("newNotification", (n) => {
      console.log("New notification received:", n);
      const newNotif = {
        _id: n.notificationId || Date.now().toString(),
        type: n.type || 'task_assigned',
        message: n.message || 'New notification',
        payload: n.payload || {},
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
      
      // Show toast with action button if it's a task assignment
      if (n.type === 'task_assigned' && n.payload?.action === 'start_working') {
        toast.info(
          <div>
            <strong>{n.message}</strong>
            <button 
              onClick={() => {
                navigate('/task-board');
              }}
              className="ml-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
            >
              Start Working
            </button>
          </div>,
          { autoClose: 10000 }
        );
      } else if (n.type === 'task_submitted') {
        toast.info(
          <div>
            <strong>{n.message}</strong>
            <button 
              onClick={() => {
                navigate('/task-board');
              }}
              className="ml-2 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
            >
              Review Task
            </button>
          </div>,
          { autoClose: 10000 }
        );
      } else {
        toast.info(n.message || "New notification");
      }
    });

    s.on("disconnect", () => {
      console.warn("Socket disconnected");
    });

    return () => {
      mounted = false;
      if (s) s.disconnect();
    };
  }, [user, navigate]);

  const markRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("mark read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("mark all read:", err);
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = (n) => {
    if (n.payload?.action === 'start_working' || n.type === 'task_assigned') {
      navigate('/task-board');
    } else if (n.payload?.action === 'review_task' || n.type === 'task_submitted') {
      navigate('/task-board');
    } else if (n.actionUrl) {
      navigate(n.actionUrl);
    } else {
      navigate('/notifications');
    }
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="relative inline-block text-left">
        <button className="flex items-center space-x-2 relative">
          <FaBell size={18} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center space-x-2 relative focus:outline-none"
        aria-label="Notifications"
      >
        <FaBell size={20} className="text-gray-600 hover:text-gray-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-[500px] flex flex-col">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-md">
            <span className="font-semibold text-gray-700">
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    n.read 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100'
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {n.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Notification'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {n.message || n.payload?.taskTitle || n.payload?.projectTitle || 'New notification'}
                      </div>
                      {n.payload?.action === 'start_working' && !n.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/task-board');
                            setOpen(false);
                          }}
                          className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                        >
                          Start Working
                        </button>
                      )}
                      {n.payload?.action === 'review_task' && !n.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/task-board');
                            setOpen(false);
                          }}
                          className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                        >
                          Review Task
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n._id);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 ml-2 flex-shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt || n.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center">
              <button 
                onClick={() => {
                  navigate('/notifications');
                  setOpen(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}