import { Link } from "react-router-dom";
import NotificationBell from "../Notifications/NotificationBell";

export default function MemberNavbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Team Member Dashboard</h1>
      <div className="flex items-center space-x-4">
        <Link to="/team-member/dashboard" className="hover:underline text-gray-700">Home</Link>
        <Link to="/team-member/my-tasks" className="hover:underline text-gray-700">My Tasks</Link>
        <Link to="/task-board" className="hover:underline text-gray-700">Task Board</Link>
        <NotificationBell />
        <Link to="/logout" className="hover:underline text-red-500">Logout</Link>
      </div>
    </nav>
  );
}