import React, { useEffect, useState, useRef } from 'react';
import { getMyProjects, getTeamProjects, updateProject } from '../services/projectService';
import { getTasksByProject, createTask, assignTask, submitTaskForReview, approveTask, updateTask } from '../services/taskService';
import { getAllTeamMembers } from '../services/userService';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FaArrowLeft, FaPlus, FaUserPlus, FaPlay, FaCheck, FaPaperPlane, FaComments, FaTimes, FaUserCircle, FaUpload } from 'react-icons/fa';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

ChartJS.register(ArcElement, Tooltip, Legend);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, { transports: ['websocket'], withCredentials: true });

const readUser = () => {
    try {
        const u = localStorage.getItem("user");
        if (u) {
            const parsed = JSON.parse(u);
            if (parsed.role) return parsed;
        }
    } catch (err) {}
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const dec = jwtDecode(token);
            return dec.user || { name: dec.name, email: dec.email, role: dec.role, id: dec.id || dec.userId || dec._id };
        }
    } catch (err) {}
    return null;
};

export default function TaskBoard() {
    const [user] = useState(readUser());
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allSystemMembers, setAllSystemMembers] = useState([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [assigningTaskId, setAssigningTaskId] = useState(null);
    const [activeChatTaskId, setActiveChatTaskId] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [taskComments, setTaskComments] = useState({});
    const messagesEndRef = useRef(null);

    // Deliverables Modal States
    const [showDeliverablesModal, setShowDeliverablesModal] = useState(false);
    const [submittingTaskId, setSubmittingTaskId] = useState(null);
    const [deliverablesText, setDeliverablesText] = useState('');
    const [deliverableFiles, setDeliverableFiles] = useState([]);

    // Register user with socket
    useEffect(() => {
        if (user?._id || user?.id) {
            const userId = user._id || user.id;
            socket.emit('register', { userId });
            console.log('Registered user with socket:', userId);
        }

        // Listen for notifications
        socket.on('newNotification', (data) => {
            toast.info(data.message || 'New notification received');
        });

        // Listen for comments
        socket.on('receiveComment', ({ taskId, comment }) => {
            setTaskComments(prev => ({
                ...prev,
                [taskId]: [...(prev[taskId] || []), comment]
            }));
            setTasks(prev => prev.map(t => {
                if (t._id === taskId) {
                    return { ...t, comments: [...(t.comments || []), comment] };
                }
                return t;
            }));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => {
            socket.off('newNotification');
            socket.off('receiveComment');
        };
    }, [user]);

    useEffect(() => {
        const fetchProjectsAndMembers = async () => {
            try {
                if (!user) return;
                
                let res;
                if (user.role === 'project_manager') {
                    res = await getMyProjects();
                    
                    try {
                        const membersRes = await getAllTeamMembers();
                        setAllSystemMembers(membersRes.data || []);
                        console.log('All system members loaded:', membersRes.data);
                    } catch (memberErr) {
                        console.error("Failed to fetch system team members:", memberErr);
                        setAllSystemMembers([]);
                    }
                } else {
                    res = await getTeamProjects();
                }
                
                const activeProjects = (res.data || []).filter(
                    p => p.status === 'Active' || p.status === 'Planning' || p.status === 'Completed'
                );
                setProjects(activeProjects);
            } catch (err) {
                toast.error("Failed to load dashboard data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectsAndMembers();

        socket.on("taskUpdated", () => {
            if (selectedProject) handleProjectClick(selectedProject);
        });

        return () => {
            socket.off("taskUpdated");
        };
    }, [user, selectedProject]);

    const handleProjectClick = async (project) => {
        try {
            setLoading(true);
            const res = await getTasksByProject(project._id);
            const tasksWithComments = (res || []).map(t => ({
                ...t,
                comments: t.comments || []
            }));
            setTasks(tasksWithComments);
            
            const commentsMap = {};
            tasksWithComments.forEach(t => {
                commentsMap[t._id] = t.comments || [];
            });
            setTaskComments(commentsMap);
            
            setSelectedProject(project);
            socket.emit('joinProject', { projectId: project._id });
        } catch (err) {
            toast.error("Failed to load tasks.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToProjects = () => {
        if (selectedProject) {
            socket.emit('leaveProject', { projectId: selectedProject._id });
        }
        setSelectedProject(null);
        setTasks([]);
        setShowAddTask(false);
        setActiveChatTaskId(null);
        setTaskComments({});
    };

    const isAssigned = (task) => {
        if (!task.assignedTo || !user) return false;
        const currentUserId = user.id || user._id || user.userId;
        const assignedId = task.assignedTo._id || task.assignedTo;
        return String(assignedId) === String(currentUserId);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        try {
            const res = await createTask({ 
                project: selectedProject._id, 
                title: newTaskTitle, 
                description: newTaskDescription || '',
                status: 'todo',
                priority: 'Medium'
            });
            const newTask = { ...res, comments: [] };
            setTasks([...tasks, newTask]);
            setTaskComments(prev => ({ ...prev, [newTask._id]: [] }));
            setNewTaskTitle("");
            setNewTaskDescription("");
            setShowAddTask(false);
            toast.success("Task created successfully!");
        } catch (err) {
            toast.error("Failed to create task");
            console.error(err);
        }
    };

    const handleAssignMember = async (taskId, memberId) => {
        try {
            await assignTask(taskId, memberId);
            toast.success("Task assigned successfully! Member will be notified.");
            
            setAssigningTaskId(null);
            handleProjectClick(selectedProject);
        } catch (err) {
            toast.error("Failed to assign member: " + (err.response?.data?.error || err.message));
            console.error(err);
        }
    };

    // Open deliverables modal for submission
    const handleSubmitWithDeliverables = (taskId) => {
        setSubmittingTaskId(taskId);
        setShowDeliverablesModal(true);
        setDeliverablesText('');
        setDeliverableFiles([]);
    };

    // Submit task with deliverables
    const handleDeliverableSubmit = async () => {
        try {
            const taskId = submittingTaskId;
            // In production, you'd upload files to server here
            await submitTaskForReview(taskId);
            
            toast.success('Task submitted for review with deliverables!');
            setShowDeliverablesModal(false);
            setDeliverablesText('');
            setDeliverableFiles([]);
            setSubmittingTaskId(null);
            handleProjectClick(selectedProject);
        } catch (err) {
            toast.error('Failed to submit task: ' + (err.response?.data?.error || err.message));
            console.error(err);
        }
    };

    const updateTaskStatusAction = async (taskId, action) => {
        try {
            let newStatus = '';
            let message = '';
            
            if (action === 'start') {
                newStatus = 'inprogress';
                message = 'Started working on task!';
                const task = tasks.find(t => t._id === taskId);
                if (task && selectedProject) {
                    socket.emit("sendNotification", {
                        userId: selectedProject.projectManager?._id || selectedProject.createdBy?._id,
                        message: `${user.name} has started working on "${task.title}"`,
                        data: { taskId, projectId: selectedProject._id }
                    });
                }
            } else if (action === 'approve') {
                await approveTask(taskId);
                newStatus = 'done';
                message = 'Task approved and marked Done!';
                
                const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, status: 'done' } : t);
                const allDone = updatedTasks.every(t => t.status === 'done');
                if (allDone && updatedTasks.length > 0) {
                    await updateProject(selectedProject._id, { status: 'Completed' });
                    toast.success("🎉 All tasks completed! Project is now Completed!");
                }
            }
            
            if (newStatus) {
                await updateTask(taskId, { status: newStatus });
                toast.success(message);
                handleProjectClick(selectedProject);
            }
        } catch (err) {
            toast.error(`Failed to execute ${action}`);
            console.error(err);
        }
    };

    const handleAddComment = (taskId) => {
        if (!commentText.trim()) return;
        
        const newComment = {
            _id: Date.now().toString(),
            user: { name: user.name || "User", _id: user._id || user.id },
            content: commentText,
            createdAt: new Date().toISOString()
        };

        setTaskComments(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), newComment]
        }));
        
        socket.emit("sendComment", { 
            taskId, 
            comment: newComment, 
            projectId: selectedProject._id 
        });
        setCommentText("");
        
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const taskData = {
        labels: ['To Do', 'In Progress', 'Review', 'Done'],
        datasets: [{
            data: [
                tasks.filter(t => t.status === 'todo').length,
                tasks.filter(t => t.status === 'inprogress').length,
                tasks.filter(t => t.status === 'review').length,
                tasks.filter(t => t.status === 'done').length,
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'],
            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
            borderWidth: 1,
        }],
    };
    
    if (loading) return <div className="p-8 text-center text-indigo-600 font-bold">Loading Data...</div>;

    if (selectedProject) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Deliverables Modal */}
                {showDeliverablesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">📤 Submit Deliverables</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Provide details about your work and attach any relevant files for the Project Manager to review.
                            </p>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description of work done *
                                </label>
                                <textarea
                                    value={deliverablesText}
                                    onChange={(e) => setDeliverablesText(e.target.value)}
                                    placeholder="Describe what you've completed, challenges faced, files included, etc..."
                                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows="4"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Attach Files (optional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setDeliverableFiles(Array.from(e.target.files))}
                                        className="w-full cursor-pointer"
                                        accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, ZIP, PNG, JPG, TXT</p>
                                </div>
                                {deliverableFiles.length > 0 && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        {deliverableFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded">
                                                <span>📎</span>
                                                <span className="truncate">{f.name}</span>
                                                <span className="text-xs text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleDeliverableSubmit}
                                    disabled={!deliverablesText.trim()}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaPaperPlane className="inline mr-2" size={12} />
                                    Submit for Review
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeliverablesModal(false);
                                        setSubmittingTaskId(null);
                                        setDeliverableFiles([]);
                                        setDeliverablesText('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={handleBackToProjects} className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold hover:underline">
                    <FaArrowLeft /> Back to Projects List
                </button>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-2xl font-bold">Project Dashboard: {selectedProject.title}</h1>
                        {user?.role === 'project_manager' && (
                            <button onClick={() => setShowAddTask(!showAddTask)} className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition">
                                <FaPlus /> Add Task
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        {user?.role === 'project_manager' ? `Project Manager View` : `Team Member View`}
                    </p>

                    {showAddTask && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border flex flex-col sm:flex-row gap-3 shadow-sm">
                            <input 
                                type="text" 
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Task title..." 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input 
                                type="text" 
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Description (optional)" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button onClick={handleAddTask} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
                            <button onClick={() => setShowAddTask(false)} className="bg-gray-300 px-3 py-2 rounded hover:bg-gray-400">×</button>
                        </div>
                    )}

                    {tasks.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 flex flex-col items-center bg-gray-50 p-4 rounded-lg border">
                                <h3 className="font-bold text-gray-700 mb-4">Task Progress Distribution</h3>
                                <div className="h-64 w-full">
                                    <Pie data={taskData} options={{ maintainAspectRatio: false }} />
                                </div>
                                <div className="mt-4 w-full text-xs text-gray-500">
                                    <div className="flex justify-between"><span>To Do</span><span>{tasks.filter(t => t.status === 'todo').length}</span></div>
                                    <div className="flex justify-between"><span>In Progress</span><span>{tasks.filter(t => t.status === 'inprogress').length}</span></div>
                                    <div className="flex justify-between"><span>Review</span><span>{tasks.filter(t => t.status === 'review').length}</span></div>
                                    <div className="flex justify-between"><span>Done</span><span>{tasks.filter(t => t.status === 'done').length}</span></div>
                                    <div className="flex justify-between font-semibold mt-1 pt-1 border-t"><span>Total</span><span>{tasks.length}</span></div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['todo', 'inprogress', 'review', 'done'].map(status => (
                                    <div key={status} className="bg-gray-50 p-3 rounded-lg border">
                                        <h3 className="font-semibold text-gray-800 capitalize border-b pb-2 mb-3 flex justify-between items-center">
                                            <span>{status === 'inprogress' ? 'In Progress' : status === 'review' ? 'Review' : status}</span>
                                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{tasks.filter(t => t.status === status).length}</span>
                                        </h3>
                                        
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                            {tasks.filter(t => t.status === status).map(t => (
                                                <div key={t._id} className="bg-white border rounded shadow-sm p-3 relative">
                                                    <p className={`font-medium ${status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                                                    {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                                                    
                                                    {t.assignedTo && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                            <FaUserCircle className="text-gray-300" />
                                                            <span>Assigned to: {t.assignedTo.name || 'Unknown'}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => setActiveChatTaskId(activeChatTaskId === t._id ? null : t._id)} 
                                                        className="absolute top-3 right-3 text-gray-400 hover:text-indigo-600 transition"
                                                    >
                                                        <FaComments />
                                                        {((taskComments[t._id] || []).length > 0) && (
                                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                                                                {(taskComments[t._id] || []).length}
                                                            </span>
                                                        )}
                                                    </button>

                                                    {user?.role === 'project_manager' && status === 'todo' && !t.assignedTo && (
                                                        <div className="mt-3 border-t pt-2">
                                                            <button 
                                                                onClick={() => setAssigningTaskId(assigningTaskId === t._id ? null : t._id)} 
                                                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded w-full flex justify-center items-center gap-1 hover:bg-indigo-100"
                                                            >
                                                                <FaUserPlus /> Find Members
                                                            </button>
                                                            {assigningTaskId === t._id && (
                                                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border rounded p-1 bg-white">
                                                                    {allSystemMembers.length > 0 ? (
                                                                        allSystemMembers.map(member => (
                                                                            <div key={member._id} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-xs hover:bg-gray-100">
                                                                                <span className="font-medium text-gray-700 flex items-center gap-1">
                                                                                    <FaUserCircle className="text-gray-400" />
                                                                                    {member.name}
                                                                                </span>
                                                                                <button 
                                                                                    onClick={() => handleAssignMember(t._id, member._id)} 
                                                                                    className="bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 shadow-sm text-[10px]"
                                                                                >
                                                                                    Assign
                                                                                </button>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-[11px] text-red-500 text-center py-2">No team members available.</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="mt-3">
                                                        {user?.role === 'team_member' && status === 'todo' && isAssigned(t) && (
                                                            <button 
                                                                onClick={() => updateTaskStatusAction(t._id, 'start')} 
                                                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded w-full flex justify-center items-center gap-1 hover:bg-blue-700"
                                                            >
                                                                <FaPlay size={10} /> Start Working
                                                            </button>
                                                        )}
                                                        {user?.role === 'team_member' && status === 'inprogress' && isAssigned(t) && (
                                                            <button 
                                                                onClick={() => handleSubmitWithDeliverables(t._id)} 
                                                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded w-full flex justify-center items-center gap-1 hover:bg-purple-700"
                                                            >
                                                                <FaUpload size={10} /> Submit Deliverables
                                                            </button>
                                                        )}
                                                        {user?.role === 'project_manager' && status === 'review' && (
                                                            <button 
                                                                onClick={() => updateTaskStatusAction(t._id, 'approve')} 
                                                                className="text-xs bg-green-600 text-white px-2 py-1 rounded w-full flex justify-center items-center gap-1 hover:bg-green-700"
                                                            >
                                                                <FaCheck size={10} /> Approve Task
                                                            </button>
                                                        )}
                                                    </div>

                                                    {activeChatTaskId === t._id && (
                                                        <div className="mt-3 p-2 bg-indigo-50 border border-indigo-100 rounded">
                                                            <div className="flex justify-between items-center mb-2 border-b border-indigo-200 pb-1">
                                                                <span className="text-xs font-bold text-indigo-800 flex items-center gap-2">
                                                                    <FaComments /> Task Communication
                                                                </span>
                                                                <button 
                                                                    onClick={() => setActiveChatTaskId(null)}
                                                                    className="text-gray-400 hover:text-red-500"
                                                                >
                                                                    <FaTimes size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="h-32 overflow-y-auto mb-2 space-y-1 pr-1">
                                                                {(taskComments[t._id] || []).map(c => (
                                                                    <div key={c._id} className="text-[11px] bg-white p-1.5 rounded shadow-sm border border-gray-100">
                                                                        <span className="font-bold text-indigo-600">{c.user?.name || 'User'}: </span>
                                                                        <span className="text-gray-700">{c.content}</span>
                                                                    </div>
                                                                ))}
                                                                <div ref={messagesEndRef} />
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <input 
                                                                    value={commentText} 
                                                                    onChange={e => setCommentText(e.target.value)} 
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(t._id)}
                                                                    placeholder="Type message..."
                                                                    className="flex-1 text-xs p-1.5 border rounded focus:outline-none focus:border-indigo-400" 
                                                                />
                                                                <button 
                                                                    onClick={() => handleAddComment(t._id)} 
                                                                    className="bg-indigo-600 text-white px-2 rounded text-xs hover:bg-indigo-700"
                                                                >
                                                                    Send
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {tasks.filter(t => t.status === status).length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 mb-4 font-medium">No tasks found for this project.</p>
                            {user?.role === 'project_manager' && (
                                <button onClick={() => setShowAddTask(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow transition font-bold">
                                    No tasks available. Add tasks.
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Task Board</h1>
            <p className="text-gray-600 mb-6">Click on a project to view its detailed task progress and communicate with team members.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div 
                        key={project._id} 
                        onClick={() => handleProjectClick(project)} 
                        className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-xl hover:border-indigo-500 border-2 border-transparent transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <h2 className="text-lg font-bold text-gray-900 truncate">{project.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 flex justify-between items-center">
                            <span>Status: <span className={`font-semibold ${
                                project.status === 'Completed' ? 'text-green-600' : 
                                project.status === 'Active' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>{project.status}</span></span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{project.progress || 0}%</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{project.description}</p>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                {project.teamMembers?.length || 0} members
                            </span>
                            <span className="text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition">
                                Manage Tasks →
                            </span>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 text-center bg-white p-12 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-700">No Projects Found</h3>
                        <p className="text-gray-500 mt-2">No active projects to show task data for.</p>
                    </div>
                )}
            </div>
        </div>
    );
}