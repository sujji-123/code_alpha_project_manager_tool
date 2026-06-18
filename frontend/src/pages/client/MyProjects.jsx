// src/pages/client/MyProjects.jsx
import React, { useEffect, useState } from "react";
import projectService from "../../services/projectService";
import { toast } from "react-toastify";
import { FaStar } from 'react-icons/fa';
import FeedbackModal from '../../components/Feedback/FeedbackModal';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", budget: 0 });
  const [selectedProjectForFeedback, setSelectedProjectForFeedback] = useState(null);

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getMyProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await projectService.updateProject(id, { status });
      setProjects((prev) => prev.map((p) => (p._id === id ? res.data : p)));
      toast.success("Status updated");
    } catch (err) {
      console.error("Status update failed:", err);
      toast.error("Status update failed");
    }
  };

  const openUpdateModal = (project) => {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      description: project.description || "",
      budget: project.budget || 0,
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await projectService.updateProject(editingProject._id, form);
      setProjects((prev) =>
        prev.map((p) => (p._id === editingProject._id ? res.data : p))
      );
      toast.success("Project updated");
      setEditingProject(null);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Update failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
      </div>

      {loading ? (
        <p>Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-gray-600 mt-2">
            You haven't posted any projects. Click "Post New Project" to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-2xl shadow p-5 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4 whitespace-pre-line">
                  {project.description}
                </p>
                <p className="text-sm text-gray-500">
                  Budget: <span className="font-medium">${project.budget ?? 0}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      project.status === "completed"
                        ? "text-green-600"
                        : project.status === "in-progress" || project.status === "allocated"
                        ? "text-yellow-700"
                        : "text-gray-600"
                    }`}
                  >
                    {project.status || "open"}
                  </span>
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.status === 'completed' ? (
                    <button
                        onClick={() => setSelectedProjectForFeedback(project)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600"
                    >
                        <FaStar /> Leave Feedback
                    </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusChange(project._id, "allocated")}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm"
                    >
                      Mark Allocated
                    </button>

                    <button
                      onClick={() => handleStatusChange(project._id, "in-progress")}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm"
                    >
                      Mark Under Work
                    </button>

                    <button
                      onClick={() => handleStatusChange(project._id, "completed")}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                    >
                      Mark Completed
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(project._id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                >
                  Delete
                </button>

                <button
                  onClick={() => openUpdateModal(project)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProjectForFeedback && (
        <FeedbackModal
            project={selectedProjectForFeedback}
            onClose={() => setSelectedProjectForFeedback(null)}
            onFeedbackSubmitted={fetchMyProjects}
        />
      )}
      
      {editingProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg p-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 mt-1"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Budget</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm({ ...form, budget: Number(e.target.value) })
                  }
                  className="w-full border rounded-lg p-2 mt-1"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}