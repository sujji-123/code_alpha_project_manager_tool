// frontend/src/pages/TeamMemberDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, NavLink, Routes, Route } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  FaUserCircle, FaCog, FaSignOutAlt, FaSearch, FaBell, FaStar,
  FaClipboardList, FaEnvelope, FaEdit, FaBars, FaTasks, FaProjectDiagram
} from 'react-icons/fa';
import { getTeamProjects } from '../services/projectService';
import { getProfile, uploadProfilePicture } from '../services/userService';
import { toast } from 'react-toastify';
import EditProfileModal from '../components/Profile/EditProfileModal';
import notificationService from '../services/notificationService';
import { getMyTasks, getTaskStats } from '../services/taskService';

const readUser = () => {
  try {
    const u = localStorage.getItem('user');
    if (u) return JSON.parse(u);
  } catch { /* ignored */ }
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const dec = jwtDecode(token);
      return dec.user || { name: dec.name, email: dec.email, role: dec.role };
    }
  } catch { /* ignored */ }
  return null;
};

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, projectRes, tasksRes, statsRes, notificationRes] = await Promise.all([
          getProfile(),
          getTeamProjects(),
          getMyTasks(),
          getTaskStats(),
          notificationService.getNotifications()
        ]);
        
        setProfile(profileRes.data);
        setProjects(projectRes.data || []);
        setMyTasks(tasksRes || []);
        setTaskStats(statsRes || {});
        // FIX: Ensure notifications is always an array
        setNotifications(Array.isArray(notificationRes.data) ? notificationRes.data : []);
      } catch (error) {
        toast.error('Failed to load dashboard data.');
        console.error("Dashboard fetch error:", error);
        // Set empty arrays on error
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const availableProjects = useMemo(() => {
    const available = projects.filter(p => p.status === 'Planning' || p.status === 'Active');
    if (!searchQuery.trim()) return available.slice(0, 3);
    return available.filter(p => p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 3);
  }, [projects, searchQuery]);
  
  // FIX: Ensure notifications is an array before filtering
  const unreadNotifications = Array.isArray(notifications) 
    ? notifications.filter((n) => !n.read).length 
    : 0;

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);
      try {
        const res = await uploadProfilePicture(formData);
        setProfile(res.data);
        toast.success('Profile picture updated!');
      } catch (err) {
        toast.error('Failed to upload profile picture.');
      }
    }
  };

  const DashboardHome = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl relative">
              <label htmlFor="profile-picture-upload" className="cursor-pointer">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </label>
              <input type="file" id="profile-picture-upload" className="hidden" onChange={handleProfilePictureChange} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{profile?.name || 'Team Member'}</h3>
              <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-500">
                <span>Team Member</span>
                <span className="flex items-center text-yellow-400"><FaStar className="mr-1" />{profile?.rating || 0}/5</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile?.skills?.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-gray-500">Tasks Completed</div>
            <div className="text-xl font-bold">{taskStats.completed || 0}/{taskStats.total || 0}</div>
            <button onClick={() => setIsEditModalOpen(true)} className="mt-2 flex items-center justify-center sm:justify-end text-indigo-600 hover:underline">
              <FaEdit className="mr-1" /> Edit Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Available Projects</h2>
            <Link to="/team-member/projects" className='text-sm text-indigo-600 hover:underline'>View All</Link>
          </div>
          <div className="space-y-4 flex-1">
            {availableProjects.length > 0 ? availableProjects.map(project => (
              <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h3 className="font-semibold text-gray-800">{project.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === "Planning" ? "bg-blue-100 text-blue-800" : project.status === "Active" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>{project.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 truncate">{project.description}</p>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Project Manager: {project.projectManager?.name || 'N/A'}
                  </span>
                  <Link to={`/project/${project._id}`} className="text-sm text-indigo-600 hover:underline font-semibold">
                    View Details
                  </Link>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No available projects matching your search.</p>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="font-semibold text-lg">Your Stats</h4>
          <div className="mt-4 text-sm text-gray-600 space-y-3">
            <div className="flex justify-between">
              <span>Total Tasks</span>
              <strong>{taskStats.total || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>In Progress</span>
              <strong>{taskStats.inProgress || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Completed</span>
              <strong>{taskStats.completed || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Overdue</span>
              <strong className="text-red-600">{taskStats.overdue || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate</span>
              <strong>{taskStats.completionRate || 0}%</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">My Tasks</h2>
            <Link to="/team-member/my-tasks" className="text-sm text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-4 flex-1">
            {myTasks.slice(0, 3).map(task => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h3 className="font-semibold text-gray-800">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                    task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'review' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.status === 'inprogress' ? 'In Progress' : task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 truncate">{task.description}</p>
                <Link to={`/task/${task._id}`} className="inline-block text-sm text-indigo-600 hover:underline font-semibold">
                  View Details →
                </Link>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-gray-500 text-center py-4">No tasks assigned yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`fixed lg:static top-0 left-0 h-full w-64 bg-white transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 z-50 flex flex-col border-r`}>
        <div className="p-6 text-2xl font-bold text-indigo-600 border-b flex justify-between items-center">
          TaskFlow
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(false)}>✖</button>
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <NavLink to="/team-member/dashboard" end className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
          }>
            <FaUserCircle className="mr-3 h-5 w-5" /> Dashboard
          </NavLink>
          <NavLink to="/team-member/my-tasks" className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
          }>
            <FaTasks className="mr-3 h-5 w-5" /> My Tasks
          </NavLink>
          <NavLink to="/task-board" className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
          }>
            <FaProjectDiagram className="mr-3 h-5 w-5" /> Task Board
          </NavLink>
          <NavLink to="/project-managers" className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
      }>
            <FaUserCircle className="mr-3 h-5 w-5" /> View Project Managers
          </NavLink>
          <NavLink to="/comments" className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
          }>
            <FaEnvelope className="mr-3 h-5 w-5" /> Comments
          </NavLink>
          <NavLink to="/team-member/settings" className={({isActive}) => 
            `flex items-center px-4 py-2.5 rounded-lg ${isActive ? 'bg-indigo-100 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-indigo-50'}`
          }>
            <FaCog className="mr-3 h-5 w-5" /> Settings
          </NavLink>
        </nav>
        <div className="p-2 border-t">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg">
            <FaSignOutAlt className="mr-3 h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto h-full flex flex-col">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome, {profile?.name || 'Team Member'}!</h1>
            <p className="text-gray-500 mt-2">Track your tasks and collaborate with your team.</p>
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-96" 
              />
            </div>
            <button className="lg:hidden p-2 bg-indigo-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <FaBars />
            </button>
            <Link to="/notifications" className="hidden sm:flex items-center text-gray-600 hover:text-gray-800 relative">
              <FaBell />
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </header>
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
          </Routes>
        </div>
      </main>

      {isEditModalOpen && (
        <EditProfileModal 
          user={profile} 
          onClose={() => setIsEditModalOpen(false)} 
          onProfileUpdate={(updatedProfile) => {setProfile(updatedProfile);}} 
        />
      )}
    </div>
  );
}