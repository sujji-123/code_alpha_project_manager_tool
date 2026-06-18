import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
// import proposalService from '../services/proposalService'; // Import proposalService for checking status
import { toast } from 'react-toastify';
import { FaBell, FaArrowLeft } from 'react-icons/fa';

// Fixed JWT decode implementation
const decodeToken = (token) => {
  try {
    // Manual JWT decoding without external library
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const readUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      return decoded?.user || { role: decoded?.role };
    }
  } catch (err) {
    console.error('Error reading user from token:', err);
  }
  return null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [proposalStatusMap, setProposalStatusMap] = useState({}); // key: projectId, value: accepted boolean

  useEffect(() => {
    // Set user state after component mounts
    const userData = readUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    const fetchAndMarkNotifications = async () => {
      if (!user) return; // Wait until user is set

      try {
        console.log('Fetching notifications for user:', user);
        const res = await notificationService.getNotifications();
        const notifs = res.data || [];
        console.log('Notifications received:', notifs);
        setNotifications(notifs);

        // Mark all as read when the page is visited
        try {
          await notificationService.markAllNotificationsRead();
          console.log('All notifications marked as read');
        } catch (markReadError) {
          console.warn('Failed to mark notifications as read:', markReadError);
        }

        // Fetch proposal acceptance status for notifications related to proposals
        const projectIds = notifs
          .filter(n => n.payload?.projectId)
          .map(n => n.payload.projectId);

        // To avoid duplicate calls for same project
        const uniqueProjectIds = Array.from(new Set(projectIds));
        console.log('Unique project IDs for status check:', uniqueProjectIds);
        
        // Fetch proposals for each project and check if any is accepted (client role)
        let statusMap = {};
        if (user?.role === 'client') {
          try {
            const proposalsRes = await proposalService.getClientProposals();
            console.log('All proposals for status check:', proposalsRes.data);
            
            for (const projectId of uniqueProjectIds) {
              // Filter proposals for this project and find any accepted
              const accepted = proposalsRes.data.some(p => 
                (p.projectId === projectId || p.project?._id === projectId) && p.status === 'accepted'
              );
              statusMap[projectId] = accepted;
              console.log(`Project ${projectId} accepted status:`, accepted);
            }
          } catch (proposalError) {
            console.error('Error fetching proposals for status check:', proposalError);
            // Initialize all to false if there's an error
            uniqueProjectIds.forEach(projectId => {
              statusMap[projectId] = false;
            });
          }
        }
        setProposalStatusMap(statusMap);

      } catch (err) {
        console.error('Error in fetchAndMarkNotifications:', err);
        toast.error('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAndMarkNotifications();
    }
  }, [user]);

  // Always return bell icon
  const getNotificationIcon = () => {
    return <FaBell className="text-blue-500" />;
  };

  // Modify link logic:
  // If proposal related notification and not accepted => link to proposal review page
  // Else link to collaboration hub
  const getNotificationLink = (notification) => {
    const projectId = notification.payload?.projectId;
    console.log('Getting link for notification:', notification, 'User role:', user?.role, 'Project ID:', projectId);
    
    if (projectId && user?.role === 'client') {
      const accepted = proposalStatusMap[projectId];
      console.log(`Project ${projectId} accepted status for linking:`, accepted);
      
      if (accepted === false) {
        // Proposal not accepted yet, link to proposal review page
        return `/client/proposal-review/${projectId}`;
      } else if (accepted === true) {
        return `/project/collaborate/${projectId}`;
      }
    }
    
    // Default fallback links based on user role
    if (user?.role === 'client') {
      return '/client/dashboard';
    } else if (user?.role === 'freelancer') {
      return '/freelancer/dashboard';
    }
    
    return '/dashboard';
  };

  const getNotificationText = (notification) => {
    const projectTitle = notification.payload?.projectTitle || 'Unknown Project';
    const freelancerName = notification.payload?.freelancerName;
    
    switch (notification.type) {
      case 'PROPOSAL_SUBMITTED':
        return `New proposal submitted for project: ${projectTitle}${freelancerName ? ` by ${freelancerName}` : ''}`;
      case 'PROPOSAL_ACCEPTED':
        return `Your proposal for "${projectTitle}" has been accepted!`;
      case 'PROPOSAL_REJECTED':
        return `Your proposal for "${projectTitle}" has been rejected.`;
      case 'MESSAGE_RECEIVED':
        return `New message received for project: ${projectTitle}`;
      case 'PROJECT_UPDATED':
        return `Project "${projectTitle}" has been updated`;
      case 'MILESTONE_ACHIEVED':
        return `Milestone achieved for project: ${projectTitle}`;
      default:
        return `Notification: ${notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            to={user?.role === 'client' ? '/client/dashboard' : user?.role === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} 
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition duration-200"
          >
            <FaArrowLeft />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600 text-sm mt-1">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification, index) => (
                <li 
                  key={notification._id || index} 
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <Link 
                    to={getNotificationLink(notification)} 
                    className="flex items-start space-x-4 p-6 block"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg 
                        className="w-5 h-5 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You're all caught up! When you receive new notifications, they'll appear here.
              </p>
            </div>
          )}
        </div>

        {/* Additional actions */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition duration-200"
          >
            Refresh
          </button>
          {notifications.length > 0 && (
            <button
              onClick={async () => {
                try {
                  await notificationService.markAllNotificationsRead();
                  toast.success('All notifications marked as read');
                } catch (error) {
                  toast.error('Failed to mark notifications as read');
                }
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}