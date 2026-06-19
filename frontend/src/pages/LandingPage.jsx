import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/Navbar/PublicNavbar';
import PublicFooter from '../components/Footer/PublicFooter';
import api from '../services/api'; 
import { FaTasks, FaComments, FaCheckCircle, FaChartLine, FaArrowRight } from 'react-icons/fa';

export default function LandingPage() {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching public projects...");
        // Try the public endpoint first
        let res;
        try {
          res = await api.get('/projects/public');
          console.log("Public projects response:", res.data);
        } catch (publicErr) {
          console.warn("Public endpoint failed, trying main endpoint:", publicErr);
          // Fallback to main endpoint
          res = await api.get('/projects');
        }
        
        // Filter for active/planning projects
        const projects = res.data || [];
        const activeProjects = projects.filter(p => 
          p.status !== 'Completed' && p.status !== 'completed'
        );
        setAvailableProjects(activeProjects.slice(0, 3));
        setError(null);
      } catch (error) {
        console.error("Fetch projects error:", error);
        setError("Could not load projects. Please try again later.");
        setAvailableProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicNavbar />

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
              <Link to="/signup" className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Get Started Free
              </Link>
              <Link to="/login" className="px-8 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
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
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-indigo-500">
                <div className="flex items-center gap-3 mb-4 border-b pb-2">
                  <span className="font-bold text-gray-800">Live Task Board Preview</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500 flex justify-between items-center">
                    <span className="font-medium text-gray-800">Setup WebSockets</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 flex justify-between items-center">
                    <span className="font-medium text-gray-800">Assign Team Members</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Available Projects</h2>
              <p className="text-gray-600 mt-2">Discover and join ongoing team initiatives.</p>
            </div>
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-2">
              View All <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
              <p className="text-red-600 mb-2">{error}</p>
              <button onClick={() => window.location.reload()} className="text-indigo-600 font-bold hover:underline">
                Retry
              </button>
            </div>
          ) : availableProjects.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {availableProjects.map((project) => (
                <div key={project._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      project.status === 'Planning' ? 'bg-purple-100 text-purple-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                    <Link to="/login" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800">Log In to View</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4 font-medium">No active projects available yet.</p>
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">Go to Dashboard</Link>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-3xl mb-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Manage Projects with <span className="text-indigo-600">Precision</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <FaTasks className="text-indigo-600 text-3xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Assign & Track</h3>
            <p className="text-gray-600">Break projects into tasks. Assign them and track progress in real-time.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <FaComments className="text-indigo-600 text-3xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Task Communication</h3>
            <p className="text-gray-600">Discuss deliverables directly inside the specific task cards using WebSockets.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <FaChartLine className="text-indigo-600 text-3xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">View dynamic pie charts to monitor the health of your project phases.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}