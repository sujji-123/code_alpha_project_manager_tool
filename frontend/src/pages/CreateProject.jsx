// src/pages/CreateProject.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/projectService';
import { toast } from 'react-toastify';

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export default function CreateProject() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser());
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    budget: '',
    priority: 'Medium',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'project_manager') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.budget) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        budget: Number(form.budget),
        priority: form.priority,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      });
      toast.success('Project created successfully!');
      navigate('/project-manager/my-projects');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Create New Project</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className="w-full border rounded-lg p-2"
              placeholder="Enter project title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={6}
              className="w-full border rounded-lg p-2"
              placeholder="Describe the project scope, goals, and requirements..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget (USD) *</label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={onChange}
                className="w-full border rounded-lg p-2"
                placeholder="2500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={onChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={onChange}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={onChange}
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}