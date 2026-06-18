// src/components/Sidebar/ManagerSidebar.jsx
import { Link } from "react-router-dom";

export default function ManagerSidebar() {
  return (
    <aside className="bg-gray-100 p-4 w-64 min-h-screen shadow">
      <ul className="space-y-3">
        <li><Link to="/project-manager/create-project" className="block hover:underline">Create Project</Link></li>
        <li><Link to="/project-manager/my-projects" className="block hover:underline">My Projects</Link></li>
        <li><Link to="/task-board" className="block hover:underline">Task Board</Link></li>
        <li><Link to="/team-members" className="block hover:underline">Team Members</Link></li>
      </ul>
    </aside>
  );
}