// frontend/src/pages/ViewProjectManagers.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProjectManagers } from '../services/userService';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';

export default function ViewProjectManagers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await getAllProjectManagers();
        setManagers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error('Failed to load project managers');
        console.error('Error:', err);
        setManagers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/team-member/dashboard" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Project Managers</h1>
      {managers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No project managers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managers.map((manager) => (
            <div key={manager._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                {manager.profilePicture ? (
                  <img src={manager.profilePicture} alt={manager.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                    {manager.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{manager.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500">{manager.email || 'No email'}</p>
                  <p className="text-xs text-gray-400">Department: {manager.department || 'N/A'}</p>
                </div>
              </div>
              <Link to={`/profile/${manager._id}`} className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}