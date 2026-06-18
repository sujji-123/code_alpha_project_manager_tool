// src/components/Profile/EditProfileModal.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import userService from '../../services/userService';

export default function EditProfileModal({ user, onClose, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    // Conditionally initialize skills or position based on user role
    skills: user.role === 'freelancer' ? (user.skills ? user.skills.join(', ') : '') : '',
    position: user.role === 'client' ? (user.position || '') : '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload, ensuring skills are converted to an array if they exist
      const payload = {
        ...formData,
      };

      if (user.role === 'freelancer' && typeof payload.skills === 'string') {
        payload.skills = payload.skills.split(',').map(skill => skill.trim());
      }
      
      const updatedProfile = await userService.updateProfile(payload);
      onProfileUpdate(updatedProfile.data);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* MODIFIED: Conditional rendering based on user role */}
          {user.role === 'freelancer' ? (
            <div className="mb-4">
              <label className="block text-gray-700">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g., React, Node.js, UI/UX Design"
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700">Current Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g., Project Manager at Google"
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}