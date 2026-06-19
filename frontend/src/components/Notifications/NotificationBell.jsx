import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import notificationService from "../../services/notificationService";
import { FaBell, FaTimes, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load notifications on mount
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
        console.log("📬 Notifications loaded:", data.length, "unread:", unread);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();

    // Socket connection
    if (!user) return;
    const userId = user._id || user.id;
    const s = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
      console.log("🔌 Socket connected, registering user:", userId);
      s.emit("register", { userId });
    });

    // Handle new notifications
    s.on("newNotification", (n) => {
      console.log("🔔 New notification received:", n);
      
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
      
      // Show WhatsApp-style toast notification
      if (n.type === 'task_assigned' && n.payload?.action === 'start_working') {
        toast.info(
          <div className="flex flex-col gap-2 min-w-[280px]">
            <div className="font-bold text-indigo-600 text-lg">📋 New Task Assigned!</div>
            <div className="text-sm text-gray-700">{n.message}</div>
            <button 
              onClick={() => {
                navigate('/task-board');
                toast.dismiss();
              }}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors w-full mt-1"
            >
              🚀 Start Working
            </button>
          </div>,
          { 
            autoClose: 20000,
            position: "top-right",
            className: "shadow-xl border-l-4 border-indigo-600 rounded-lg"
          }
        );
      } else if (n.type === 'task_submitted') {
        toast.info(
          <div className="flex flex-col gap-2 min-w-[280px]">
            <div className="font-bold text-purple-600 text-lg">📤 Task Submitted!</div>
            <div className="text-sm text-gray-700">{n.message}</div>
            <button 
              onClick={() => {
                navigate('/task-board');
                toast.dismiss();
              }}
              className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors w-full mt-1"
            >
              📋 Review Task
            </button>
          </div>,
          { 
            autoClose: 20000,
            position: "top-right",
            className: "shadow-xl border-l-4 border-purple-600 rounded-lg"
          }
        );
      } else if (n.type === 'task_approved') {
        toast.success(
          <div className="flex flex-col gap-2 min-w-[280px]">
            <div className="font-bold text-green-600 text-lg">✅ Task Approved!</div>
            <div className="text-sm text-gray-700">{n.message}</div>
          </div>,
          { 
            autoClose: 8000,
            position: "top-right",
            className: "shadow-xl border-l-4 border-green-600 rounded-lg"
          }
        );
      } else {
        toast.info(n.message || "New notification", {
          autoClose: 5000,
          position: "top-right"
        });
      }
    });

    s.on("disconnect", () => {
      console.warn("🔌 Socket disconnected");
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
    }
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="relative p-2 text-gray-400">
          <FaBell size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 max-h-[500px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex justify-between items-center">
            <div>
              <span className="font-semibold text-gray-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <FaCheck size={10} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBell className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 mb-1.5 rounded-lg cursor-pointer transition-all ${
                    n.read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-indigo-50 border-l-4 border-indigo-500 hover:bg-indigo-100'
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {n.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Notification'}
                        {!n.read && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {n.message || n.payload?.taskTitle || n.payload?.projectTitle || 'New notification'}
                      </div>
                      
                      {/* Action Button */}
                      {n.payload?.action === 'start_working' && !n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/task-board');
                            setIsOpen(false);
                          }}
                          className="mt-2 bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          🚀 Start Working
                        </button>
                      )}
                      {n.payload?.action === 'review_task' && !n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/task-board');
                            setIsOpen(false);
                          }}
                          className="mt-2 bg-purple-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          📋 Review Task
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n._id);
                        }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 flex-shrink-0"
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center bg-gray-50">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}