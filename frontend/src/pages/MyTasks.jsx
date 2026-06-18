// src/pages/MyTasks.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyTasks } from '../services/taskService';
import { toast } from 'react-toastify';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getMyTasks();
        setTasks(data || []);
      } catch (err) {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{task.title}</h2>
                <p className="text-gray-600 mt-1">{task.description}</p>
                <div className="mt-2 flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.status === 'done' ? 'bg-green-100 text-green-800' :
                    task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {task.priority}
                  </span>
                </div>
              </div>
              <Link to={`/task/${task._id}`} className="text-indigo-600 hover:underline">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}