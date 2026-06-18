// src/components/Sidebar/MemberSidebar.jsx
import { Link } from "react-router-dom";

export default function MemberSidebar() {
  return (
    <aside className="bg-gray-100 p-4 w-64 min-h-screen shadow">
      <ul className="space-y-3">
        <li><Link to="/team-member/my-tasks" className="block hover:underline">My Tasks</Link></li>
        <li><Link to="/task-board" className="block hover:underline">Task Board</Link></li>
        <li><Link to="/project-managers" className="block hover:underline">Project Managers</Link></li>
      </ul>
    </aside>
  );
}