// frontend/src/pages/ViewTeamMembers.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTeamMembers } from '../services/userService';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';

export default function ViewTeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await getAllTeamMembers();
        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error('Failed to load team members');
        console.error('Error:', err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/project-manager/dashboard" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Team Members</h1>
      {members.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No team members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                {member.profilePicture ? (
                  <img src={member.profilePicture} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                    {member.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{member.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500">{member.email || 'No email'}</p>
                  <p className="text-xs text-gray-400">Skills: {member.skills?.join(', ') || 'N/A'}</p>
                </div>
              </div>
              <Link to={`/profile/${member._id}`} className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}