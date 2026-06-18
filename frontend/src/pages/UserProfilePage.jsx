// frontend/src/pages/UserProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserProfileById } from '../services/userService';
import { FaArrowLeft, FaUserCircle, FaStar, FaBriefcase, FaLightbulb } from 'react-icons/fa';

const StarRating = ({ rating }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating || 0);
    const emptyStars = totalStars - fullStars;
  
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400" />)}
        {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-gray-300" />)}
        <span className="ml-2 text-sm text-gray-600">({(rating || 0).toFixed(1)}/5)</span>
      </div>
    );
};

export default function UserProfilePage() {
    const { userId } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getUserProfileById(userId);
                setProfileData(res.data);
            } catch (err) {
                toast.error("Could not load user profile.");
                console.error("Fetch profile error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    if (loading) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    if (!profileData || !profileData.user) {
        return <div className="p-8 text-center">User not found.</div>;
    }

    const { user, reviews = [], projects = [] } = profileData;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to={-1} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                        <FaArrowLeft /> Back
                    </Link>
                </div>

                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {user.profilePicture ? (
                            <img 
                                src={user.profilePicture} 
                                alt={user.name} 
                                className="w-24 h-24 rounded-full object-cover" 
                            />
                        ) : (
                            <FaUserCircle className="text-gray-300 text-8xl" />
                        )}
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-gray-800">{user.name || 'Unknown User'}</h1>
                            <p className="text-indigo-600 font-semibold capitalize">{user.role || 'User'}</p>
                            {user.position && <p className="text-gray-500">{user.position}</p>}
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                <StarRating rating={user.rating || 0} />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
                        </div>
                    </div>
                    {user.bio && (
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="font-semibold text-gray-700">Bio</h3>
                            <p className="text-gray-600 whitespace-pre-wrap">{user.bio}</p>
                        </div>
                    )}
                    {user.skills && user.skills.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold text-gray-700">Skills</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {user.skills.map((skill, index) => (
                                    <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Projects Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaBriefcase /> Projects
                    </h2>
                    <div className="space-y-4">
                        {projects && projects.length > 0 ? (
                            projects.map(proj => (
                                <div key={proj._id} className="bg-white rounded-xl shadow p-4">
                                    <p className="font-bold text-gray-800">{proj.title}</p>
                                    <p className="text-sm text-gray-500">
                                        Status: <span className="font-semibold capitalize">{proj.status || 'N/A'}</span>
                                    </p>
                                    {proj.progress !== undefined && (
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full" 
                                                    style={{ width: `${proj.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{proj.progress || 0}% complete</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="bg-white rounded-xl shadow p-4 text-gray-500">This user has no projects to display.</p>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaLightbulb /> Reviews
                    </h2>
                    <div className="space-y-4">
                        {reviews && reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review._id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                                    <div className="flex items-start gap-4">
                                        {review.reviewer?.profilePicture ? (
                                            <img 
                                                src={review.reviewer.profilePicture} 
                                                alt={review.reviewer.name} 
                                                className="w-12 h-12 rounded-full object-cover" 
                                            />
                                        ) : (
                                            <FaUserCircle className="text-gray-400 text-5xl" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-gray-800">
                                                    {review.reviewer?.name || "Anonymous"}
                                                </p>
                                                <StarRating rating={review.rating || 0} />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Reviewed on: {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                            {review.comment && (
                                                <p className="mt-3 text-gray-700 bg-gray-50 p-3 rounded-md">
                                                    "{review.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="bg-white rounded-xl shadow p-4 text-gray-500">
                                This user has not received any reviews yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}