// frontend/src/pages/CommentsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyProjects } from '../services/projectService';
import { getCommentsByTask, createComment } from '../services/commentService';
import { getTasksByProject } from '../services/taskService';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

const readUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (u) return JSON.parse(u);
  } catch (err) { /* ignore */ }
  return null;
};

export default function CommentsPage() {
  const navigate = useNavigate();
  const [user] = useState(readUser());
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load projects for the user
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        setProjects(res.data || []);
      } catch (err) {
        toast.error('Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Load tasks for selected project
  useEffect(() => {
    if (!selectedProject) return;

    const fetchTasks = async () => {
      try {
        const data = await getTasksByProject(selectedProject._id);
        setTasks(data || []);
        setSelectedTask(null);
        setComments([]);
      } catch (err) {
        toast.error('Failed to load tasks');
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  // Load comments for selected task
  useEffect(() => {
    if (!selectedTask) return;

    const fetchComments = async () => {
      try {
        const data = await getCommentsByTask(selectedTask._id);
        setComments(data || []);
      } catch (err) {
        toast.error('Failed to load comments');
        console.error('Error fetching comments:', err);
      }
    };

    fetchComments();
  }, [selectedTask]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    setSubmitting(true);
    try {
      const comment = await createComment(selectedTask._id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error('Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToTasks = () => {
    setSelectedTask(null);
    setComments([]);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setTasks([]);
    setSelectedTask(null);
    setComments([]);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // VIEW 3: Show comments for selected task
  if (selectedTask) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button 
          onClick={handleBackToTasks} 
          className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold hover:underline"
        >
          <FaArrowLeft /> Back to Tasks
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
            <p className="text-gray-600 mt-2">{selectedTask.description || 'No description'}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${
                selectedTask.status === 'done' ? 'bg-green-100 text-green-800' :
                selectedTask.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                selectedTask.status === 'review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedTask.status}
              </span>
              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                Priority: {selectedTask.priority || 'Medium'}
              </span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            
            {/* Add Comment Form */}
            <form onSubmit={handleSendComment} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaPaperPlane /> Send
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {comment.user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-semibold">{comment.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Show tasks for selected project
  if (selectedProject) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button 
          onClick={handleBackToProjects} 
          className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold hover:underline"
        >
          <FaArrowLeft /> Back to Projects
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Tasks for: {selectedProject.title}</h1>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks found for this project.</p>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'done' ? 'bg-green-100 text-green-800' :
                        task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'review' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {task.comments?.length || 0} comments
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // VIEW 1: Show list of projects
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Task Comments</h1>
      <p className="text-gray-600 mb-6">Select a project to view and add comments to tasks.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project._id}
            onClick={() => setSelectedProject(project)}
            className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-xl hover:border-indigo-500 border-2 border-transparent transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-gray-900 truncate">{project.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className={`font-semibold ${
                project.status === 'Completed' ? 'text-green-600' : 
                project.status === 'Active' ? 'text-yellow-600' : 
                'text-blue-600'
              }`}>{project.status}</span>
            </p>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                View Comments
              </span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center bg-white p-12 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700">No Projects Found</h3>
            <p className="text-gray-500 mt-2">Create a project to start adding comments.</p>
          </div>
        )}
      </div>
    </div>
  );
}