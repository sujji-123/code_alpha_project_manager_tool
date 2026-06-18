// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { changePassword, getProfile, updateNotificationPreferences } from '../services/userService';
import { FaArrowLeft, FaKey, FaUserEdit, FaBell, FaExclamationTriangle } from 'react-icons/fa';
import EditProfileModal from '../components/Profile/EditProfileModal';

const readUser = () => {
    try {
        const token = localStorage.getItem("token");
        if (token) return jwtDecode(token).user;
    } catch (err) { /* ignore */ }
    return null;
};

// --- Sub-components for each setting view ---

const ChangePasswordView = () => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error("New passwords do not match.");
        if (passwords.newPassword.length < 6) return toast.error("Password must be at least 6 characters.");

        try {
            const res = await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            toast.success(res.data.msg || "Password updated successfully!");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to change password.");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Change Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields... */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div className="text-right">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Update Password</button>
                </div>
            </form>
        </div>
    );
};

const NotificationSettingsView = ({ profile, setProfile }) => {
    const handleToggle = async (e) => {
        const enabled = e.target.checked;
        try {
            const res = await updateNotificationPreferences({ enabled });
            setProfile(res.data);
            toast.success("Notification preferences updated.");
        } catch (error) {
            toast.error("Failed to update preferences.");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Notification Preferences</h2>
            <div className="flex items-center justify-between">
                <span className="text-gray-700">Enable Email Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={profile?.emailNotificationsEnabled ?? true} onChange={handleToggle} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>
    );
};

const DangerZoneView = () => (
    <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-300">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
            <div>
                <p className="font-semibold text-gray-800">Delete Your Account</p>
                <p className="text-sm text-gray-500">Once deleted, this action cannot be undone.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Delete Account</button>
        </div>
    </div>
);


export default function SettingsPage() {
    const [user] = useState(readUser());
    const [activeView, setActiveView] = useState('password'); // 'password', 'notifications', 'danger'
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        getProfile().then(res => setProfile(res.data)).catch(() => toast.error("Could not load profile."));
    }, []);
    
    const navButtons = [
        { key: 'profile', label: 'Edit Profile', icon: FaUserEdit, action: () => setIsEditModalOpen(true) },
        { key: 'password', label: 'Change Password', icon: FaKey, action: () => setActiveView('password') },
        { key: 'notifications', label: 'Notifications', icon: FaBell, action: () => setActiveView('notifications') },
        { key: 'danger', label: 'Danger Zone', icon: FaExclamationTriangle, action: () => setActiveView('danger') }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to={user?.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard'} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <FaArrowLeft /> Back to Dashboard
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <nav className="space-y-2">
                            {navButtons.map(btn => (
                                <button
                                    key={btn.key}
                                    onClick={btn.action}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-colors ${activeView === btn.key ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'}`}
                                >
                                    <btn.icon className={activeView === btn.key ? 'text-indigo-600' : 'text-gray-500'} />
                                    <span>{btn.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="md:col-span-2">
                        {activeView === 'password' && <ChangePasswordView />}
                        {activeView === 'notifications' && profile && <NotificationSettingsView profile={profile} setProfile={setProfile} />}
                        {activeView === 'danger' && <DangerZoneView />}
                    </div>
                </div>
            </div>
            {isEditModalOpen && profile && (
                <EditProfileModal user={profile} onClose={() => setIsEditModalOpen(false)} onProfileUpdate={setProfile} />
            )}
        </div>
    );
}