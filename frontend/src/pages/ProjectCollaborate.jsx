// frontend/src/pages/ProjectCollaborate.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  getTasksByProject, 
  createTask, 
  updateTaskStatus, 
  deleteTask,
  assignTask,
  submitTaskForReview,
  approveTask,
  getTasksByStatus
} from '../services/taskService';
import { getCommentsByTask, createComment } from '../services/commentService';
import projectService from '../services/projectService';
import { getProjectTeamMembers } from '../services/userService';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaPlus, 
  FaUserPlus, 
  FaCheck, 
  FaTimes,
  FaSpinner,
  FaUserCircle,
  FaCheckCircle,
  FaClock,
  FaUsers
} from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SOCKET_URL = '/';

const readUser = () => {
  try {
    const u = localStorage.getItem("user");
    if (u) return JSON.parse(u);
  } catch (err) { /* ignore */ }
  try {
    const token = localStorage.getItem("token");
    if (token) return jwtDecode(token).user;
  } catch (err) { return null; }
  return null;
};

export default function ProjectCollaborate() {
  const { projectId } = useParams();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [user] = useState(readUser());
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], review: [], done: [] });
  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, inprogress: 0, review: 0, done: 0 });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectRes, tasksRes, teamRes] = await Promise.all([
        projectService.getProjectById(projectId),
        getTasksByStatus(projectId),
        getProjectTeamMembers(projectId)
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes || { todo: [], inprogress: [], review: [], done: [] });
      setTeamMembers(teamRes.data?.teamMembers || []);
      
      const all = [...(tasksRes.todo || []), ...(tasksRes.inprogress || []), ...(tasksRes.review || []), ...(tasksRes.done || [])];
      setAllTasks(all);
      setTaskStats({
        total: all.length,
        todo: tasksRes.todo?.length || 0,
        inprogress: tasksRes.inprogress?.length || 0,
        review: tasksRes.review?.length || 0,
        done: tasksRes.done?.length || 0
      });
    } catch (error) {
      toast.error('Failed to load project data.');
      console.error("Fetch Data Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!selectedTask) {
      setTaskComments([]);
      return;
    }
    
    const fetchComments = async () => {
      try {
        const data = await getCommentsByTask(selectedTask._id);
        setTaskComments(data || []);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };
    fetchComments();
  }, [selectedTask]);

  useEffect(() => {
    fetchData();

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { withCredentials: true, path: '/socket.io' });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinProject', { projectId });
      });

      socketRef.current.on('taskCreated', (newTask) => {
        setTasks(prev => ({
          ...prev,
          todo: [newTask, ...(prev.todo || [])]
        }));
        setAllTasks(prev => [newTask, ...prev]);
        toast.info(`New task: ${newTask.title}`);
      });

      socketRef.current.on('taskUpdated', (updatedTask) => {
        setTasks(prev => {
          const newTasks = { ...prev };
          Object.keys(newTasks).forEach(key => {
            newTasks[key] = newTasks[key].map(t => 
              t._id === updatedTask._id ? updatedTask : t
            );
          });
          return newTasks;
        });
        setAllTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        if (selectedTask?._id === updatedTask._id) {
          setSelectedTask(updatedTask);
        }
      });

      socketRef.current.on('taskDeleted', ({ _id }) => {
        setTasks(prev => {
          const newTasks = { ...prev };
          Object.keys(newTasks).forEach(key => {
            newTasks[key] = newTasks[key].filter(t => t._id !== _id);
          });
          return newTasks;
        });
        setAllTasks(prev => prev.filter(t => t._id !== _id));
        if (selectedTask?._id === _id) {
          setSelectedTask(null);
          setTaskComments([]);
        }
      });
      
      socketRef.current.on('commentCreated', (data) => {
        if (data.taskId === selectedTask?._id) {
          setTaskComments(prev => [...prev, data.comment]);
        }
        setAllTasks(prev => prev.map(task => {
          if (task._id === data.taskId) {
            return { ...task, comments: [...(task.comments || []), data.comment._id] };
          }
          return task;
        }));
      });

      socketRef.current.on('projectUpdated', (updatedProject) => {
        setProject(updatedProject);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, fetchData, selectedTask]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [taskComments]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await createTask({ 
        project: projectId, 
        title: newTaskTitle,
        description: newTaskDescription,
        assignedTo: null,
        priority: newTaskPriority
      });
      setTasks(prev => ({
        ...prev,
        todo: [newTask, ...(prev.todo || [])]
      }));
      setAllTasks(prev => [newTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('Medium');
      setShowAddTask(false);
      toast.success('Task added!');
    } catch (error) {
      toast.error('Failed to add task.');
      console.error("Add task error:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Task marked as ${status}!`);
    } catch (error) {
      toast.error('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted!');
      if (selectedTask?._id === taskId) {
        setSelectedTask(null);
        setTaskComments([]);
      }
    } catch (error) {
      toast.error('Failed to delete task.');
    }
  };

  const handleAssignTask = async (taskId, userId) => {
    try {
      await assignTask(taskId, userId);
      setShowAssignModal(false);
      setSelectedTaskForAssign(null);
      toast.success('Task assigned successfully!');
    } catch (error) {
      toast.error('Failed to assign task.');
      console.error("Assign error:", error);
    }
  };

  const handleSubmitTask = async (taskId) => {
    if (!window.confirm('Submit this task for review?')) return;
    try {
      await submitTaskForReview(taskId);
      toast.success('Task submitted for review!');
    } catch (error) {
      toast.error('Failed to submit task.');
    }
  };

  const handleApproveTask = async (taskId) => {
    if (!window.confirm('Approve this task?')) return;
    try {
      await approveTask(taskId);
      toast.success('Task approved!');
    } catch (error) {
      toast.error('Failed to approve task.');
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !selectedTask) return;
    try {
      const comment = await createComment(selectedTask._id, newMessageContent.trim());
      setTaskComments([...taskComments, comment]);
      setNewMessageContent('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to send comment.');
      console.error("Send comment error:", error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">Loading Collaboration Space...</div>;
  }

  const pieData = {
    labels: ['To Do', 'In Progress', 'Review', 'Done'],
    datasets: [{
      data: [taskStats.todo, taskStats.inprogress, taskStats.review, taskStats.done],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'],
      borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link 
          to={user?.role === 'project_manager' ? '/project-manager/dashboard' : '/team-member/dashboard'} 
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mb-4"
        >
          <FaArrowLeft />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{project?.title || "Project Collaboration"}</h1>
            <p className="text-gray-500 mt-1">{project?.description}</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="text-sm text-gray-500">Status: <span className={`font-semibold ${
                project?.status === 'Completed' ? 'text-green-600' : 
                project?.status === 'Active' ? 'text-yellow-600' : 
                'text-blue-600'
              }`}>{project?.status || 'Planning'}</span></span>
              <span className="text-sm text-gray-500">Progress: {project?.progress || 0}%</span>
              <span className="text-sm text-gray-500">Members: {teamMembers.length}</span>
              <span className="text-sm text-gray-500">Tasks: {taskStats.total}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            {user?.role === 'project_manager' && (
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <FaPlus /> Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500">Total Tasks</h4>
          <p className="text-2xl font-bold">{taskStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500">Completed</h4>
          <p className="text-2xl font-bold text-green-600">{taskStats.done}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500">In Progress</h4>
          <p className="text-2xl font-bold text-yellow-600">{taskStats.inprogress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm text-gray-500">Completion</h4>
          <p className="text-2xl font-bold text-indigo-600">
            {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="lg:col-span-4">
          {showAddTask && user?.role === 'project_manager' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-semibold mb-3">Create New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="border rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="border rounded-lg p-2"
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="border rounded-lg p-2 flex-1"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <button
                    onClick={handleAddTask}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="bg-gray-300 px-3 py-2 rounded-lg hover:bg-gray-400"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border p-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>To Do ({tasks.todo?.length || 0})</span>
                  <FaClock className="text-gray-400" />
                </h3>
                {tasks.todo?.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                    onAssign={() => {
                      setSelectedTaskForAssign(task);
                      setShowAssignModal(true);
                    }}
                    onSubmit={handleSubmitTask}
                    onApprove={handleApproveTask}
                    isSelected={selectedTask?._id === task._id}
                    user={user}
                    teamMembers={teamMembers}
                  />
                ))}
                {(!tasks.todo || tasks.todo.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
                )}
              </div>

              <div className="bg-yellow-50 rounded-lg p-3">
                <h3 className="font-semibold text-yellow-700 mb-2 flex items-center justify-between">
                  <span>In Progress ({tasks.inprogress?.length || 0})</span>
                  <FaSpinner className="text-yellow-500 animate-spin" />
                </h3>
                {tasks.inprogress?.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                    onAssign={() => {
                      setSelectedTaskForAssign(task);
                      setShowAssignModal(true);
                    }}
                    onSubmit={handleSubmitTask}
                    onApprove={handleApproveTask}
                    isSelected={selectedTask?._id === task._id}
                    user={user}
                    teamMembers={teamMembers}
                  />
                ))}
                {(!tasks.inprogress || tasks.inprogress.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center justify-between">
                  <span>Review ({tasks.review?.length || 0})</span>
                  <FaCheck className="text-blue-500" />
                </h3>
                {tasks.review?.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                    onAssign={() => {
                      setSelectedTaskForAssign(task);
                      setShowAssignModal(true);
                    }}
                    onSubmit={handleSubmitTask}
                    onApprove={handleApproveTask}
                    isSelected={selectedTask?._id === task._id}
                    user={user}
                    teamMembers={teamMembers}
                  />
                ))}
                {(!tasks.review || tasks.review.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-3">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center justify-between">
                  <span>Done ({tasks.done?.length || 0})</span>
                  <FaCheckCircle className="text-green-500" />
                </h3>
                {tasks.done?.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                    onAssign={() => {
                      setSelectedTaskForAssign(task);
                      setShowAssignModal(true);
                    }}
                    onSubmit={handleSubmitTask}
                    onApprove={handleApproveTask}
                    isSelected={selectedTask?._id === task._id}
                    user={user}
                    teamMembers={teamMembers}
                  />
                ))}
                {(!tasks.done || tasks.done.length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border p-4 rounded-lg shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Comments {selectedTask ? `- ${selectedTask.title}` : ''}
            </h2>
            {!selectedTask ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-center">Select a task<br/>to view comments</p>
              </div>
            ) : (
              <>
                <div className="border h-80 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md flex-1 flex flex-col gap-2">
                  {taskComments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet.</p>
                  ) : (
                    taskComments.map((comment) => (
                      <div key={comment._id} className={`flex ${comment.user?._id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-[85%] ${comment.user?._id === user?.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-black'}`}>
                          <p className="font-bold text-sm">{comment.user?.name || 'User'}</p>
                          <p className="break-words">{comment.content}</p>
                          <p className="text-xs opacity-75 mt-1 text-right">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    className="border p-2 flex-1 rounded-md text-sm" 
                    placeholder="Write a comment..." 
                    value={newMessageContent} 
                    onChange={(e) => setNewMessageContent(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment(e)} 
                  />
                  <button 
                    className="bg-indigo-600 text-white px-3 py-2 rounded-md flex items-center justify-center gap-1 text-sm"
                    onClick={handleSendComment}
                    disabled={!newMessageContent.trim()}
                  >
                    <FaPaperPlane className="text-xs" /> Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && selectedTaskForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Assign Task</h3>
            <p className="text-gray-600 mb-4">Task: <strong>{selectedTaskForAssign.title}</strong></p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No team members available</p>
              ) : (
                teamMembers.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {member.profilePicture ? (
                        <img src={member.profilePicture} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <FaUserCircle className="text-gray-400 text-2xl" />
                      )}
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <button
                      onClick={() => handleAssignTask(selectedTaskForAssign._id, member._id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedTaskForAssign(null);
              }}
              className="mt-4 w-full bg-gray-300 py-2 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Card Component
const TaskCard = ({ task, onStatusChange, onDelete, onSelect, onAssign, onSubmit, onApprove, isSelected, user }) => {
  const statuses = ['todo', 'inprogress', 'review', 'done'];
  const currentIndex = statuses.indexOf(task.status);
  const isAssigned = task.assignedTo !== null;

  return (
    <div 
      className={`bg-white rounded-lg shadow p-3 mb-2 cursor-pointer hover:shadow-md ${isSelected ? 'border-2 border-indigo-500' : ''}`}
      onClick={() => onSelect(task)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs ${
              task.status === 'done' ? 'bg-green-100 text-green-800' :
              task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'review' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status === 'inprogress' ? 'In Progress' : task.status}
            </span>
            {task.priority && (
              <span className={`px-2 py-0.5 rounded text-xs ${
                task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
            )}
            {isAssigned && (
              <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                Assigned
              </span>
            )}
          </div>
          {isAssigned && task.assignedTo && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              <FaUserCircle className="inline mr-1" />
              {task.assignedTo.name || 'Unknown'}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {user?.role === 'project_manager' && (
            <div className="flex gap-1">
              {currentIndex > 0 && (
                <button 
                  onClick={() => onStatusChange(task._id, statuses[currentIndex - 1])}
                  className="text-xs text-gray-400 hover:text-gray-600"
                  title="Move left"
                >
                  ←
                </button>
              )}
              {currentIndex < statuses.length - 1 && (
                <button 
                  onClick={() => onStatusChange(task._id, statuses[currentIndex + 1])}
                  className="text-xs text-gray-400 hover:text-gray-600"
                  title="Move right"
                >
                  →
                </button>
              )}
              <button 
                onClick={() => onDelete(task._id)}
                className="text-xs text-red-400 hover:text-red-600"
                title="Delete"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 justify-end">
            {!isAssigned && user?.role === 'project_manager' && (
              <button
                onClick={(e) => { e.stopPropagation(); onAssign(); }}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-200 flex items-center gap-1"
              >
                <FaUserPlus className="text-xs" /> Assign
              </button>
            )}
            
            {isAssigned && task.assignedTo?._id === user?.id && task.status === 'inprogress' && (
              <button
                onClick={(e) => { e.stopPropagation(); onSubmit(task._id); }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
              >
                Submit
              </button>
            )}
            
            {user?.role === 'project_manager' && task.status === 'review' && (
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(task._id); }}
                className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200 flex items-center gap-1"
              >
                <FaCheck className="text-xs" /> Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};