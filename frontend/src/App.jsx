// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketProvider } from './context/SocketContext';

import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProjectManagerDashboard from './pages/ProjectManagerDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import ProjectCollaborate from './pages/ProjectCollaborate';
import NotificationsPage from './pages/NotificationsPage';
import CommentsPage from './pages/CommentsPage';
import SettingsPage from './pages/SettingsPage';
import TaskBoard from './pages/TaskBoard';
import TaskDetailsPage from './pages/TaskDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import MyTasks from './pages/MyTasks';
import ViewProjectManagers from './pages/ViewProjectManagers';
import ViewTeamMembers from './pages/ViewTeamMembers';

function App() {
  return (
    <SocketProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Project Manager Routes */}
          <Route path="/project-manager/dashboard/*" element={<ProjectManagerDashboard />} />
          <Route path="/project-manager/create-project" element={<CreateProject />} />
          <Route path="/project-manager/my-projects" element={<MyProjects />} />
          <Route path="/project-manager/settings" element={<SettingsPage />} />
          
          {/* Team Member Routes */}
          <Route path="/team-member/dashboard/*" element={<TeamMemberDashboard />} />
          <Route path="/team-member/my-tasks" element={<MyTasks />} />
          <Route path="/team-member/projects" element={<ProjectDetails />} /> {/* ADDED */}
          <Route path="/team-member/settings" element={<SettingsPage />} />
          
          {/* Shared Routes */}
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/project/collaborate/:projectId" element={<ProjectCollaborate />} />
          <Route path="/task-board" element={<TaskBoard />} />
          <Route path="/task/:id" element={<TaskDetailsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/project-managers" element={<ViewProjectManagers />} />
          <Route path="/team-members" element={<ViewTeamMembers />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;