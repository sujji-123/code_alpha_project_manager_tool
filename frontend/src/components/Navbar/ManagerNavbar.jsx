// src/components/Navbar/ManagerNavbar.jsx
import { Link } from "react-router-dom";
import NotificationBell from "../Notifications/NotificationBell";

export default function ManagerNavbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Project Manager Dashboard</h1>
      <div className="flex items-center space-x-4">
        <Link to="/project-manager/dashboard" className="hover:underline">Home</Link>
        <Link to="/project-manager/create-project" className="hover:underline">Create Project</Link>
        <Link to="/task-board" className="hover:underline">Task Board</Link>
        <NotificationBell />
        <Link to="/logout" className="hover:underline text-red-500">Logout</Link>
      </div>
    </nav>
  );
}