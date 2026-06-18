// src/pages/TaskDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { getTasksByProject } from '../services/taskService';
import projectService from '../services/projectService';
// import { getFreelancerProposals } from '../services/proposalService';
import { FaCheckCircle, FaSpinner, FaCircle, FaComment, FaArrowLeft } from 'react-icons/fa';

// Standardized readUser function for consistency
const readUser = () => {
    try {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
    } catch (err) { /* ignore */ }
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const dec = jwtDecode(token);
            return dec.user || { role: dec.role, id: dec.id };
        }
    } catch (err) { /* ignore */ }
    return null;
};

export default function TaskDetailsPage() {
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useState(readUser());
    const navigate = useNavigate();

    useEffect(() => {
        // This effect is now more robust. It ensures the user object exists
        // before attempting to fetch any data.
        if (!user || !user.role) {
            toast.error("You must be logged in to view tasks.");
            navigate('/login');
            return;
        }

        const fetchAllTasks = async () => {
            try {
                let tasksPromises = [];
                if (user.role === 'client') {
                    const res = await projectService.getMyProjects();
                    const projects = res.data || [];
                    tasksPromises = projects.map(p => getTasksByProject(p._id));
                } else {
                    const proposalRes = await getFreelancerProposals();
                    const activeProposals = (proposalRes.data || []).filter(p => p.status === 'accepted');
                    tasksPromises = activeProposals.map(p => getTasksByProject(p.project._id));
                }

                const tasksResults = await Promise.all(tasksPromises);
                setAllTasks(tasksResults.flat());
            } catch (err) {
                toast.error('Failed to load tasks.');
                console.error("Fetch tasks error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllTasks();
    }, [user, navigate]); // Depend on the user object itself for reliability

    const getTasksByStatus = (status) => allTasks.filter((t) => t.status === status);

    const getStatusIcon = (status) => {
        switch (status) {
            case "done": return <FaCheckCircle className="text-green-500" />;
            case "inprogress": return <FaSpinner className="text-blue-500 animate-spin" />;
            default: return <FaCircle className="text-gray-400" />;
        }
    };

    const getPriorityBadge = (priority) => {
        const classes = {
            high: "bg-red-100 text-red-800",
            medium: "bg-yellow-100 text-yellow-800",
            low: "bg-green-100 text-green-800",
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[priority]}`}>{priority || 'normal'}</span>;
    };

    if (loading) return <div className="p-8 text-center">Loading all tasks...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to={user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard'} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        <FaArrowLeft />
                        Back to Dashboard
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Full Task Progress</h1>
                <div className="bg-white rounded-xl shadow-md p-6">
                    {allTasks.length > 0 ? (
                        <div className="space-y-6">
                            {["todo", "inprogress", "done"].map((status) => (
                                <div key={status}>
                                    <h3 className="font-semibold text-gray-800 text-xl capitalize mb-3 border-b pb-2">{status === 'inprogress' ? 'In Progress' : status}</h3>
                                    <div className="space-y-3">
                                        {getTasksByStatus(status).length > 0 ? getTasksByStatus(status).map((task) => (
                                            <div key={task._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center">
                                                    {getStatusIcon(task.status)}
                                                    <span className="ml-3 font-medium text-gray-700">{task.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm mt-2 sm:mt-0">
                                                    {getPriorityBadge(task.priority)}
                                                    <span className="text-gray-500 flex items-center gap-1">{task.comments?.length || 0} <FaComment /></span>
                                                    <span className="text-gray-500">{new Date(task.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-gray-400">No tasks in this category.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No tasks have been created yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}