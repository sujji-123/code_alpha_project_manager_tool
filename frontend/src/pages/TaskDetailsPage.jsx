// src/pages/TaskDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { getTasksByProject, updateTask, assignTask, submitTaskForReview, approveTask } from '../services/taskService';
import projectService from '../services/projectService';
import { FaCheckCircle, FaSpinner, FaCircle, FaComment, FaArrowLeft, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const readUser = () => {
    try {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
    } catch (err) {}
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const dec = jwtDecode(token);
            return dec.user || { role: dec.role, id: dec.id };
        }
    } catch (err) {}
    return null;
};

export default function TaskDetailsPage() {
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useState(readUser());
    const [currentIndex, setCurrentIndex] = useState(0); 
    const navigate = useNavigate();
    const { projectId } = useParams();

    useEffect(() => {
        if (!user || !user.role) {
            toast.error("You must be logged in to view tasks.");
            navigate('/login');
            return;
        }

        const fetchTasks = async () => {
            try {
                let tasksResults = [];
                if (projectId) {
                    tasksResults = await getTasksByProject(projectId);
                } else {
                    const res = await projectService.getMyProjects();
                    const projects = res.data || [];
                    const tasksPromises = projects.map(p => getTasksByProject(p._id));
                    const nestedTasks = await Promise.all(tasksPromises);
                    tasksResults = nestedTasks.flat();
                }
                setAllTasks(Array.isArray(tasksResults) ? tasksResults : []);
            } catch (err) {
                toast.error('Failed to load tasks.');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user, navigate, projectId]);

    const getTasksByStatus = (status) => allTasks.filter((t) => t.status === status);

    const handleNextCard = (statusArrayLength) => {
        if (currentIndex < statusArrayLength - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const isAssigned = (task) => {
        if (!task.assignedTo) return false;
        return task.assignedTo === user.id || task.assignedTo._id === user.id;
    };

    const handleStatusAction = async (taskId, action) => {
        try {
            let newStatus = '';
            if (action === 'start') {
                await updateTask(taskId, { status: 'inprogress' });
                newStatus = 'inprogress';
            } else if (action === 'submit') {
                await submitTaskForReview(taskId);
                newStatus = 'review';
            } else if (action === 'approve') {
                await approveTask(taskId);
                newStatus = 'done';
            }
            toast.success(`Task status updated!`);
            setAllTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
            setCurrentIndex(0); 
        } catch (err) {
            toast.error("Failed to update task status");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "done": return <FaCheckCircle className="text-green-500" />;
            case "inprogress": return <FaSpinner className="text-blue-500 animate-spin" />;
            case "review": return <FaCheckCircle className="text-yellow-500" />;
            default: return <FaCircle className="text-gray-400" />;
        }
    };

    const getPriorityBadge = (priority) => {
        const classes = {
            high: "bg-red-100 text-red-800",
            medium: "bg-yellow-100 text-yellow-800",
            low: "bg-green-100 text-green-800",
            critical: "bg-purple-100 text-purple-800"
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[priority] || classes.medium}`}>{priority || 'normal'}</span>;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><FaSpinner className="animate-spin text-4xl text-indigo-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link to={user?.role === 'project_manager' ? '/project-manager/dashboard' : '/team-member/dashboard'} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-medium">
                        <FaArrowLeft /> Back to Dashboard
                    </Link>
                    {user?.role === 'project_manager' && (
                        <Link to="/task-board" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow-sm">
                            Manage Tasks inside Task Board
                        </Link>
                    )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-8">All Tasks Overview</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {["todo", "inprogress", "review", "done"].map((status) => {
                        const statusTasks = getTasksByStatus(status);
                        const displayTask = statusTasks[currentIndex] || statusTasks[0]; 

                        return (
                            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
                                <h3 className="font-bold text-gray-800 text-lg capitalize mb-4 flex items-center justify-between border-b pb-2">
                                    {status === 'inprogress' ? 'In Progress' : status === 'review' ? 'Review' : status}
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{statusTasks.length}</span>
                                </h3>
                                
                                {statusTasks.length > 0 && displayTask ? (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative transition-all flex-1 flex flex-col">
                                        <div className="flex items-center mb-3">
                                            {getStatusIcon(displayTask.status)}
                                            <span className="ml-3 font-semibold text-gray-800 line-clamp-1">{displayTask.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{displayTask.description || 'No description provided.'}</p>
                                        
                                        <div className="flex justify-between items-center text-sm mb-4">
                                            {getPriorityBadge(displayTask.priority)}
                                            <span className="text-gray-500 flex items-center gap-1"><FaComment className="text-gray-400"/> {displayTask.comments?.length || 0}</span>
                                        </div>

                                        <div className="border-t pt-3 mt-auto flex justify-between items-center">
                                            {user?.role === 'project_manager' && status === 'todo' && !displayTask.assignedTo && (
                                                <Link to="/task-board" className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 font-medium w-full text-center">
                                                    Assign in Task Board
                                                </Link>
                                            )}
                                            {user?.role === 'team_member' && status === 'todo' && isAssigned(displayTask) && (
                                                <button onClick={() => handleStatusAction(displayTask._id, 'start')} className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 font-medium w-full">
                                                    Start Working
                                                </button>
                                            )}
                                            {user?.role === 'team_member' && status === 'inprogress' && isAssigned(displayTask) && (
                                                <button onClick={() => handleStatusAction(displayTask._id, 'submit')} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-medium w-full">
                                                    Submit Deliverable
                                                </button>
                                            )}
                                            {user?.role === 'project_manager' && status === 'review' && (
                                                <button onClick={() => handleStatusAction(displayTask._id, 'approve')} className="text-sm bg-purple-50 text-purple-600 px-3 py-1 rounded hover:bg-purple-100 font-medium w-full">
                                                    Approve & Complete
                                                </button>
                                            )}
                                        </div>

                                        {statusTasks.length > 1 && (
                                            <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                                                <button onClick={handlePrevCard} disabled={currentIndex === 0} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 p-1">
                                                    <FaChevronLeft />
                                                </button>
                                                <span className="text-xs text-gray-400">{currentIndex + 1} of {statusTasks.length}</span>
                                                <button onClick={() => handleNextCard(statusTasks.length)} disabled={currentIndex === statusTasks.length - 1} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 p-1">
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex-1 flex items-center justify-center">
                                        <p className="text-sm text-gray-400">No tasks currently.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}