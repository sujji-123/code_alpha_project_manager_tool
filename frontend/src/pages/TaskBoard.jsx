// frontend/src/pages/TaskBoard.jsx
import React, { useEffect, useState } from 'react';
import { getMyProjects, getTeamProjects, updateProject } from '../services/projectService';
import { getTasksByProject, createTask, updateTask, assignTask, submitTaskForReview, approveTask } from '../services/taskService';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FaArrowLeft, FaPlus, FaUserPlus, FaPlay, FaCheck, FaPaperPlane } from 'react-icons/fa';
import io from 'socket.io-client';

ChartJS.register(ArcElement, Tooltip, Legend);
const socket = io("http://localhost:5000"); // Ensure this matches your backend URL

const readUser = () => {
    try {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
    } catch (err) { /* ignore */ }
    return null;
};

export default function TaskBoard() {
    const [user] = useState(readUser());
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [assigningTaskId, setAssigningTaskId] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                let res;
                if (user.role === 'project_manager') {
                    res = await getMyProjects();
                } else {
                    res = await getTeamProjects();
                }
                
                const activeProjects = (res.data || []).filter(
                    p => p.status === 'Active' || p.status === 'Planning' || p.status === 'Completed'
                );
                setProjects(activeProjects);
            } catch (err) {
                toast.error("Failed to load projects.");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchProjects();

        socket.on("taskUpdated", () => {
            if (selectedProject) handleProjectClick(selectedProject);
        });

        return () => socket.off("taskUpdated");
    }, [user, selectedProject]);

    const handleProjectClick = async (project) => {
        try {
            setLoading(true);
            const res = await getTasksByProject(project._id);
            setTasks(res || []);
            setSelectedProject(project);
        } catch (err) {
            toast.error("Failed to load tasks for this project.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToProjects = () => {
        setSelectedProject(null);
        setTasks([]);
        setShowAddTask(false);
    };

    // Helper to fix MongoDB object population vs string ID comparison
    const isAssigned = (task) => {
        if (!task.assignedTo) return false;
        return task.assignedTo === user.id || task.assignedTo._id === user.id;
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        try {
            const res = await createTask({ project: selectedProject._id, title: newTaskTitle, status: 'todo' });
            setTasks([...tasks, res.data]);
            setNewTaskTitle("");
            setShowAddTask(false);
            toast.success("Task created!");
        } catch (err) {
            toast.error("Failed to create task");
        }
    };

    const handleAssignMember = async (taskId, memberId) => {
        try {
            // Using the specialized route to trigger the backend Notification creation
            await assignTask(taskId, memberId);
            toast.success("Member assigned! Notification sent.");
            setAssigningTaskId(null);
            handleProjectClick(selectedProject);
        } catch (err) {
            toast.error("Failed to assign member");
        }
    };

    const updateTaskStatusAction = async (taskId, action) => {
        try {
            if (action === 'start') {
                await updateTask(taskId, { status: 'inprogress' });
                toast.success("Started working on task!");
            } else if (action === 'submit') {
                await submitTaskForReview(taskId);
                toast.success("Deliverable submitted for review!");
            } else if (action === 'approve') {
                await approveTask(taskId);
                toast.success("Task approved and completed!");
            }
            
            handleProjectClick(selectedProject);
        } catch (err) {
            toast.error(`Failed to ${action} task`);
        }
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
    
    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (selectedProject) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <button onClick={handleBackToProjects} className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold hover:underline">
                    <FaArrowLeft /> Back to Projects List
                </button>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-2xl font-bold">Task Progress for: {selectedProject.title}</h1>
                        {user.role === 'project_manager' && (
                            <button onClick={() => setShowAddTask(!showAddTask)} className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700">
                                <FaPlus /> Add Tasks
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        {user.role === 'project_manager' ? `Project Manager: ${user.name}` : `Team Member: ${user.name}`}
                    </p>

                    {showAddTask && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border flex gap-3">
                            <input 
                                type="text" 
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Enter task description (e.g. Develop frontend)" 
                                className="flex-1 px-3 py-2 border rounded"
                            />
                            <button onClick={handleAddTask} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Task</button>
                        </div>
                    )}

                    {tasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64 md:h-auto">
                                <Pie data={taskData} options={{ maintainAspectRatio: false }} />
                            </div>
                            <div className="space-y-4">
                                {/* TO DO LIST */}
                                <div>
                                    <h3 className="font-semibold text-lg text-red-600 border-b pb-1 mb-2">To Do</h3>
                                    {tasks.filter(t => t.status === 'todo').map(t => (
                                        <div key={t._id} className="bg-white border rounded p-3 mb-2 shadow-sm">
                                            <p className="text-gray-800 font-medium">{t.title}</p>
                                            
                                            {/* Manager Assignment View */}
                                            {user.role === 'project_manager' && !t.assignedTo && (
                                                <div className="mt-2">
                                                    <button onClick={() => setAssigningTaskId(assigningTaskId === t._id ? null : t._id)} className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">
                                                        <FaUserPlus /> Find Team Members
                                                    </button>
                                                    {assigningTaskId === t._id && (
                                                        <div className="mt-2 space-y-2 border-t pt-2">
                                                            {selectedProject.teamMembers?.length > 0 ? (
                                                                selectedProject.teamMembers.map(member => (
                                                                    <div key={member._id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                                        <span>{member.name}</span>
                                                                        <button onClick={() => handleAssignMember(t._id, member._id)} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">Assign</button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-red-500">No team members added to this project yet.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Team Member Start Working View */}
                                            {user.role === 'team_member' && isAssigned(t) && (
                                                <button onClick={() => updateTaskStatusAction(t._id, 'start')} className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-700">
                                                    <FaPlay /> Start Working
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {tasks.filter(t => t.status === 'todo').length === 0 && <p className="text-gray-400 text-sm">No tasks</p>}
                                </div>

                                {/* IN PROGRESS LIST */}
                                <div>
                                    <h3 className="font-semibold text-lg text-amber-600 border-b pb-1 mb-2">In Progress</h3>
                                    {tasks.filter(t => t.status === 'inprogress').map(t => (
                                        <div key={t._id} className="bg-white border rounded p-3 mb-2 shadow-sm border-l-4 border-amber-500">
                                            <p className="text-gray-800 font-medium">{t.title}</p>
                                            {user.role === 'team_member' && isAssigned(t) && (
                                                <button onClick={() => updateTaskStatusAction(t._id, 'submit')} className="mt-2 text-sm bg-purple-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-purple-700">
                                                    <FaPaperPlane /> Submit Deliverable
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {tasks.filter(t => t.status === 'inprogress').length === 0 && <p className="text-gray-400 text-sm">No tasks</p>}
                                </div>

                                {/* REVIEW LIST */}
                                <div>
                                    <h3 className="font-semibold text-lg text-blue-600 border-b pb-1 mb-2">Review</h3>
                                    {tasks.filter(t => t.status === 'review').map(t => (
                                        <div key={t._id} className="bg-white border rounded p-3 mb-2 shadow-sm border-l-4 border-blue-500">
                                            <p className="text-gray-800 font-medium">{t.title}</p>
                                            {user.role === 'project_manager' && (
                                                <button onClick={() => updateTaskStatusAction(t._id, 'approve')} className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700">
                                                    <FaCheck /> Approve & Complete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {tasks.filter(t => t.status === 'review').length === 0 && <p className="text-gray-400 text-sm">No tasks</p>}
                                </div>

                                {/* DONE LIST */}
                                <div>
                                    <h3 className="font-semibold text-lg text-green-600 border-b pb-1 mb-2">Done</h3>
                                    {tasks.filter(t => t.status === 'done').map(t => (
                                        <p key={t._id} className="text-gray-500 line-through p-2 bg-gray-50 rounded mb-1">{t.title}</p>
                                    ))}
                                    {tasks.filter(t => t.status === 'done').length === 0 && <p className="text-gray-400 text-sm">No tasks</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-500 mb-4">No tasks found for this project.</p>
                            {user.role === 'project_manager' && (
                                <button onClick={() => setShowAddTask(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                                    Add your first task
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
            <p className="text-gray-600 mb-6">Click on a project to view its detailed task progress.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div 
                        key={project._id} 
                        onClick={() => handleProjectClick(project)} 
                        className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-xl hover:border-indigo-500 border-2 border-transparent transition-all duration-300 transform hover:-translate-y-1"
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
                                View Progress
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