// src/components/Notifications/NotificationBell.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import notificationService from "../../services/notificationService";
import proposalService from "../../services/proposalService";
import { FaBell } from "react-icons/fa";
import { toast } from "react-toastify";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  // get user from local storage (your app already stores user/token)
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  useEffect(() => {
    let mounted = true;
    // load existing notifications for the logged in user
    (async () => {
      try {
        if (!user) return;
        const res = await notificationService.getNotifications();
        if (!mounted) return;
        setNotifications(res.data || []);
        setUnreadCount((res.data || []).filter(n => !n.read).length);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    })();

    // connect socket
    if (!user) return;
    const s = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
      s.emit("register", { userId: user._id });
    });

    s.on("notification", (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
      toast.info("New notification");
      // dispatch global event so other parts (like dashboard) can refresh proposals
      try {
        if (n && n.type && n.type.startsWith("proposal")) {
          window.dispatchEvent(new CustomEvent("proposal_updated", { detail: n }));
        }
      } catch (e) { console.warn(e); }
    });

    s.on("disconnect", () => {
      console.warn("Socket disconnected");
    });

    return () => {
      mounted = false;
      if (s) s.disconnect();
    };
  }, [user]);

  const markRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (socket) {
        socket.emit("read_notification", { id, userId: user._id });
      }
    } catch (err) {
      console.error("mark read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.read).map((n) => notificationService.markNotificationRead(n._id))
      );
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("mark all read:", err);
    }
  };

  const handleAccept = async (n) => {
    try {
      // this calls your backend to accept
      await proposalService.acceptProposal(n.payload.proposalId);
      // mark notification as read
      await notificationService.markNotificationRead(n._id);
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // notify other components (dashboard) to refresh proposals
      window.dispatchEvent(new CustomEvent("proposal_updated", { detail: { proposalId: n.payload.proposalId, status: "accepted" } }));
    } catch (err) {
      console.error("accept err:", err);
      toast.error("Failed to accept");
    }
  };

  const handleReject = async (n) => {
    try {
      await proposalService.rejectProposal(n.payload.proposalId);
      await notificationService.markNotificationRead(n._id);
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent("proposal_updated", { detail: { proposalId: n.payload.proposalId, status: "rejected" } }));
    } catch (err) {
      console.error("reject err:", err);
      toast.error("Failed to reject");
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-2">
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-red-500 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-2 max-h-96 overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-500 underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 && (
              <div className="text-sm text-gray-500 p-2">No notifications</div>
            )}
            {notifications.map((n) => (
              <div key={n._id} className={`p-2 border-b ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm">
                      <strong>{n.title || n.type}</strong>
                      <div className="text-xs text-gray-600">{n.message || (n.payload && n.payload.projectTitle)}</div>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {!n.read && (
                      <button onClick={() => markRead(n._id)} className="text-xs text-indigo-600 underline mr-2">Mark</button>
                    )}
                    {/* If these notifications allow action (client-side) show buttons */}
                    {n.type === "proposal_received" && n.payload && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(n)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(n)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(n.createdAt || n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
