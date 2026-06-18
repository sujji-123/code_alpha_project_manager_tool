// frontend/src/pages/ProjectCollaborate.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getTasksByProject, createTask, updateTaskStatus, deleteTask } from '../services/taskService';
import { getCommentsByTask, createComment } from '../services/commentService';
import projectService from '../services/projectService';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';

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

const ProjectCollaborate = () => {
    const { projectId } = useParams();
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [user] = useState(readUser());
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newMessageContent, setNewMessageContent] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskComments, setTaskComments] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [projectRes, tasksRes] = await Promise.all([
                projectService.getProjectById(projectId),
                getTasksByProject(projectId),
            ]);

            setProject(projectRes.data);
            setTasks(tasksRes || []);
        } catch (error) {
            toast.error('Failed to load project data.');
            console.error("Fetch Data Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Fetch comments when a task is selected
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
                setTasks(prev => [...prev, newTask]);
            });

            socketRef.current.on('taskUpdated', (updatedTask) => {
                setTasks(prevTasks => prevTasks.map(task => task._id === updatedTask._id ? updatedTask : task));
            });

            socketRef.current.on('taskDeleted', ({ _id }) => {
                setTasks(prev => prev.filter(task => task._id !== _id));
            });
            
            socketRef.current.on('commentCreated', (data) => {
                if (data.taskId === selectedTask?._id) {
                    setTaskComments(prev => [...prev, data.comment]);
                }
                // Also update the task's comment count
                setTasks(prev => prev.map(task => {
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
                assignedTo: null
            });
            setTasks([...tasks, newTask]);
            setNewTaskTitle('');
            setNewTaskDescription('');
            toast.success('Task added!');
        } catch (error) {
            toast.error('Failed to add task.');
            console.error("Add task error:", error);
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        try {
            const updatedTask = await updateTaskStatus(taskId, status);
            setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)));
            toast.success(`Task marked as ${status}!`);
        } catch (error) {
            toast.error('Failed to update task status.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await deleteTask(taskId);
            setTasks(tasks.filter((task) => task._id !== taskId));
            if (selectedTask?._id === taskId) {
                setSelectedTask(null);
                setTaskComments([]);
            }
            toast.success('Task deleted!');
        } catch (error) {
            toast.error('Failed to delete task.');
        }
    };

    const handleSendMessage = async () => {
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

    // Get filtered tasks by status
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress');
    const reviewTasks = tasks.filter(t => t.status === 'review');
    const doneTasks = tasks.filter(t => t.status === 'done');

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
                <h1 className="text-3xl font-bold text-gray-800">{project?.title || "Project Collaboration"}</h1>
                <p className="text-gray-500 mt-1">
                    {user?.role === 'project_manager'
                        ? `Project Manager: ${project?.projectManager?.name || user?.name || 'N/A'}`
                        : `Team Member: ${user?.name || 'N/A'}`
                    }
                </p>
                <div className="flex gap-4 mt-2">
                    <span className="text-sm text-gray-500">Status: {project?.status || 'N/A'}</span>
                    <span className="text-sm text-gray-500">Progress: {project?.progress || 0}%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Task Board - Takes 3 columns */}
                <div className="lg:col-span-3">
                    <div className="bg-white border p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700">Task Board</h2>
                            {user?.role === 'project_manager' && (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="border p-2 rounded-md w-48" 
                                        placeholder="Task title..." 
                                        value={newTaskTitle} 
                                        onChange={(e) => setNewTaskTitle(e.target.value)} 
                                    />
                                    <input 
                                        type="text" 
                                        className="border p-2 rounded-md w-48" 
                                        placeholder="Description..." 
                                        value={newTaskDescription} 
                                        onChange={(e) => setNewTaskDescription(e.target.value)} 
                                    />
                                    <button 
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md"
                                        onClick={handleAddTask}
                                    >
                                        Add Task
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {/* To Do Column */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h3 className="font-semibold text-gray-700 mb-2">To Do ({todoTasks.length})</h3>
                                {todoTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onStatusChange={handleUpdateTaskStatus}
                                        onDelete={handleDeleteTask}
                                        onSelect={setSelectedTask}
                                        isSelected={selectedTask?._id === task._id}
                                        user={user}
                                    />
                                ))}
                            </div>

                            {/* In Progress Column */}
                            <div className="bg-yellow-50 rounded-lg p-3">
                                <h3 className="font-semibold text-yellow-700 mb-2">In Progress ({inProgressTasks.length})</h3>
                                {inProgressTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onStatusChange={handleUpdateTaskStatus}
                                        onDelete={handleDeleteTask}
                                        onSelect={setSelectedTask}
                                        isSelected={selectedTask?._id === task._id}
                                        user={user}
                                    />
                                ))}
                            </div>

                            {/* Review Column */}
                            <div className="bg-blue-50 rounded-lg p-3">
                                <h3 className="font-semibold text-blue-700 mb-2">Review ({reviewTasks.length})</h3>
                                {reviewTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onStatusChange={handleUpdateTaskStatus}
                                        onDelete={handleDeleteTask}
                                        onSelect={setSelectedTask}
                                        isSelected={selectedTask?._id === task._id}
                                        user={user}
                                    />
                                ))}
                            </div>

                            {/* Done Column */}
                            <div className="bg-green-50 rounded-lg p-3">
                                <h3 className="font-semibold text-green-700 mb-2">Done ({doneTasks.length})</h3>
                                {doneTasks.map(task => (
                                    <TaskCard 
                                        key={task._id} 
                                        task={task} 
                                        onStatusChange={handleUpdateTaskStatus}
                                        onDelete={handleDeleteTask}
                                        onSelect={setSelectedTask}
                                        isSelected={selectedTask?._id === task._id}
                                        user={user}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Panel - Takes 1 column */}
                <div className="lg:col-span-1">
                    <div className="bg-white border p-4 rounded-lg shadow-sm h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">
                            Comments {selectedTask ? `- ${selectedTask.title}` : ''}
                        </h2>
                        {!selectedTask ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <p>Select a task to view comments</p>
                            </div>
                        ) : (
                            <>
                                <div className="border h-96 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md flex-1 flex flex-col gap-2">
                                    {taskComments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No comments yet.</p>
                                    ) : (
                                        taskComments.map((comment) => (
                                            <div key={comment._id} className={`flex ${comment.user?._id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`rounded-lg px-3 py-2 max-w-xs ${comment.user?._id === user?.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-black'}`}>
                                                    <p className="font-bold text-sm">{comment.user?.name || 'User'}</p>
                                                    <p>{comment.content}</p>
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
                                        className="border p-2 flex-1 rounded-md" 
                                        placeholder="Write a comment..." 
                                        value={newMessageContent} 
                                        onChange={(e) => setNewMessageContent(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                                    />
                                    <button 
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                                        onClick={handleSendMessage}
                                        disabled={!newMessageContent.trim()}
                                    >
                                        <FaPaperPlane /> Send
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Task Card Component
const TaskCard = ({ task, onStatusChange, onDelete, onSelect, isSelected, user }) => {
    const statuses = ['todo', 'inprogress', 'review', 'done'];
    const currentIndex = statuses.indexOf(task.status);

    return (
        <div 
            className={`bg-white rounded-lg shadow p-3 mb-2 cursor-pointer hover:shadow-md ${isSelected ? 'border-2 border-indigo-500' : ''}`}
            onClick={() => onSelect(task)}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
                    )}
                    {task.assignedTo && (
                        <span className="text-xs text-gray-400">Assigned to: {task.assignedTo.name || 'Unknown'}</span>
                    )}
                    <div className="mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                            task.status === 'done' ? 'bg-green-100 text-green-800' :
                            task.status === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'review' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {task.status === 'inprogress' ? 'In Progress' : task.status}
                        </span>
                        {task.priority && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                {task.priority}
                            </span>
                        )}
                    </div>
                </div>
                {user?.role === 'project_manager' && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {currentIndex > 0 && (
                            <button 
                                onClick={() => onStatusChange(task._id, statuses[currentIndex - 1])}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            >
                                ←
                            </button>
                        )}
                        {currentIndex < statuses.length - 1 && (
                            <button 
                                onClick={() => onStatusChange(task._id, statuses[currentIndex + 1])}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            >
                                →
                            </button>
                        )}
                        <button 
                            onClick={() => onDelete(task._id)}
                            className="text-xs text-red-400 hover:text-red-600 ml-1"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCollaborate;