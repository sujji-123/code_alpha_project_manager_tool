// src/components/Sidebar/FreelancerSidebar.jsx
import { Link } from "react-router-dom";

export default function FreelancerSidebar() {
  return (
    <aside className="bg-gray-100 p-4 w-64 min-h-screen shadow">
      <ul className="space-y-3">
        <li><Link to="/freelancer/projects" className="block hover:underline">Browse Projects</Link></li>
        <li><Link to="/freelancer/tasks" className="block hover:underline">My Tasks</Link></li>
        <li><Link to="/task-progress" className="block hover:underline">Task Progress</Link></li>
        <li><Link to="/freelancer/earnings" className="block hover:underline">My Earnings</Link></li>
      </ul>
    </aside>
  );
}