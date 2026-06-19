import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyProjects, getTeamProjects } from '../services/projectService';
import { getCommentsByTask, createComment } from '../services/commentService';
import { getTasksByProject } from '../services/taskService';
import { getProjectTeamMembers } from '../services/userService';
import { FaArrowLeft, FaPaperPlane, FaUserCircle, FaUsers } from 'react-icons/fa';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, { transports: ['websocket'], withCredentials: true });

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
  const [projectMembers, setProjectMembers] = useState([]);
  const messagesEndRef = useRef(null);

  // Register user with socket
  useEffect(() => {
    if (user?._id || user?.id) {
      const userId = user._id || user.id;
      socket.emit('register', { userId });
    }

    socket.on('receiveComment', ({ taskId, comment }) => {
      if (selectedTask && selectedTask._id === taskId) {
        setComments(prev => [...prev, comment]);
      }
    });

    return () => {
      socket.off('receiveComment');
    };
  }, [user, selectedTask]);

  // Load projects for the user - FIXED: Get both created and team projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Get both created projects and team projects
        const [createdRes, teamRes] = await Promise.all([
          getMyProjects(),
          getTeamProjects()
        ]);
        
        const createdProjects = createdRes.data || [];
        const teamProjects = teamRes.data || [];
        
        // Merge and deduplicate
        const allProjects = [...createdProjects];
        const projectIds = new Set(allProjects.map(p => p._id));
        teamProjects.forEach(p => {
          if (!projectIds.has(p._id)) {
            allProjects.push(p);
            projectIds.add(p._id);
          }
        });
        
        setProjects(allProjects);
        console.log('All projects loaded:', allProjects.length);
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
        
        socket.emit('joinProject', { projectId: selectedProject._id });
        
        try {
          const membersRes = await getProjectTeamMembers(selectedProject._id);
          const allMembers = [];
          if (membersRes.data?.projectManager) {
            allMembers.push(membersRes.data.projectManager);
          }
          if (membersRes.data?.teamMembers) {
            allMembers.push(...membersRes.data.teamMembers);
          }
          setProjectMembers(allMembers);
        } catch (memberErr) {
          console.error('Failed to fetch project members:', memberErr);
        }
      } catch (err) {
        toast.error('Failed to load tasks');
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
    
    return () => {
      if (selectedProject) {
        socket.emit('leaveProject', { projectId: selectedProject._id });
      }
    };
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    setSubmitting(true);
    try {
      const comment = await createComment(selectedTask._id, newComment.trim());
      setComments([...comments, comment]);
      setNewComment('');
      
      socket.emit('sendComment', {
        taskId: selectedTask._id,
        comment: comment,
        projectId: selectedProject._id
      });
      
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
    if (selectedProject) {
      socket.emit('leaveProject', { projectId: selectedProject._id });
    }
    setSelectedProject(null);
    setTasks([]);
    setSelectedTask(null);
    setComments([]);
    setProjectMembers([]);
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
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${
                selectedTask.status === 'done' ? 'bg-green-100 text-green-800' :
                selectedTask.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                selectedTask.status === 'review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedTask.status === 'inprogress' ? 'In Progress' : selectedTask.status}
              </span>
              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                Priority: {selectedTask.priority || 'Medium'}
              </span>
              {selectedTask.assignedTo && (
                <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                  Assigned to: {selectedTask.assignedTo.name || 'Unknown'}
                </span>
              )}
            </div>
          </div>

          {/* Project Members Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <FaUsers /> Project Members ({projectMembers.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {projectMembers.map(member => (
                <div key={member._id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                  {member.profilePicture ? (
                    <img src={member.profilePicture} alt={member.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <FaUserCircle className="text-gray-400 text-xl" />
                  )}
                  <span className="text-sm">{member.name}</span>
                  {member._id === user?._id && (
                    <span className="text-xs text-indigo-600 font-medium">(You)</span>
                  )}
                  {member.role === 'project_manager' && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">PM</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            
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

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {comment.user?.profilePicture ? (
                        <img src={comment.user.profilePicture} alt={comment.user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {comment.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="font-semibold">{comment.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {comment.user?._id === user?._id && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">You</span>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
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
                      {task.assignedTo && (
                        <p className="text-xs text-gray-400 mt-1">
                          Assigned to: {task.assignedTo.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'done' ? 'bg-green-100 text-green-800' :
                        task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'review' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'inprogress' ? 'In Progress' : task.status}
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
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {project.teamMembers?.length || 0} members
              </span>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                View Comments
              </span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center bg-white p-12 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700">No Projects Found</h3>
            <p className="text-gray-500 mt-2">You are not part of any projects yet. Ask a Project Manager to add you to a project.</p>
          </div>
        )}
      </div>
    </div>
  );
}