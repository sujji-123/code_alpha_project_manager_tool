// frontend/src/pages/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/Navbar/PublicNavbar';
import PublicFooter from '../components/Footer/PublicFooter';
import api from '../services/api'; 
import { 
  FaProjectDiagram, 
  FaTasks, 
  FaComments, 
  FaUsers, 
  FaCheckCircle, 
  FaChartLine,
  FaBell,
  FaArrowRight
} from 'react-icons/fa';

export default function LandingPage() {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch actual projects for the "Available Projects" section via safe public route
  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        const res = await api.get('/projects/public'); 
        setAvailableProjects(res.data ? res.data.slice(0, 3) : []);
      } catch (error) {
        console.error("Error fetching projects for landing page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Manage Projects <br />
              <span className="text-indigo-600">Effortlessly</span> with TaskFlow
            </h1>
            <p className="text-lg text-gray-600 mt-6 leading-relaxed">
              A powerful project management tool designed for teams to collaborate, 
              track progress, and deliver results. Create projects, assign tasks, 
              and communicate seamlessly.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/signup" 
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Get Started Free
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> Advanced Analytics</span>
              <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> Real-time Sockets</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500">Task Board Preview</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Setup WebSockets</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Database Schema</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Review</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">User Authentication</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Available Projects Section */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Available Projects</h2>
              <p className="text-gray-600 mt-2">Discover and join ongoing team initiatives.</p>
            </div>
            <Link to="/projects" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-2">
              View All <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : availableProjects.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {availableProjects.map((project) => (
                <div key={project._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'Planning' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {project.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                    <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-800">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No public projects available at the moment.</p>
              <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in to create one</Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Everything You Need to <span className="text-indigo-600">Manage Projects</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaTasks className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Assign & Track Tasks</h3>
            <p className="text-gray-600">Break down projects into tasks. Assign to team members and track progress dynamically.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaComments className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">In-Task Communication</h3>
            <p className="text-gray-600">Comment directly inside tasks. Keep managers and members aligned with threaded discussions.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaChartLine className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">View real-time pie charts and progress bars to monitor the health of your deliverables.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 border-t border-gray-100">
        <div className="bg-indigo-600 rounded-2xl p-8 md:p-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Boost Productivity?</h2>
          <Link to="/signup" className="mt-4 px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition inline-block">
            Create Your Workspace
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}