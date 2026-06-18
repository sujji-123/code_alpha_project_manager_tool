// frontend/src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/Navbar/PublicNavbar';
import PublicFooter from '../components/Footer/PublicFooter';
import { 
  FaProjectDiagram, 
  FaTasks, 
  FaComments, 
  FaUsers, 
  FaCheckCircle, 
  FaRocket,
  FaChartLine,
  FaBell,
  FaShieldAlt
} from 'react-icons/fa';

export default function LandingPage() {
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
              <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> No credit card</span>
              <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> Free forever</span>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-500">Task Board</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Design Homepage</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">API Integration</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Review</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Deploy to Production</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Everything You Need to <span className="text-indigo-600">Manage Projects</span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            TaskFlow provides all the tools your team needs to collaborate effectively and deliver projects on time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaProjectDiagram className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Projects</h3>
            <p className="text-gray-600">
              Create and organize projects with ease. Set goals, deadlines, and assign team members.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaTasks className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Assign Tasks</h3>
            <p className="text-gray-600">
              Break down projects into tasks. Assign to team members and track progress in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaComments className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Communication</h3>
            <p className="text-gray-600">
              Comment on tasks and projects. Keep everyone aligned with threaded conversations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaUsers className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Invite team members to projects. Work together seamlessly with real-time updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaChartLine className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Visualize project progress with task boards and completion metrics.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FaBell className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="text-gray-600">
              Get instant notifications when tasks are updated, assigned, or completed.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How <span className="text-indigo-600">TaskFlow</span> Works
            </h2>
            <p className="text-gray-600 mt-4">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-gray-600">
                Sign up as a Project Manager or Team Member and set up your profile.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Projects & Tasks</h3>
              <p className="text-gray-600">
                Start a project, add team members, and create tasks with priorities and deadlines.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborate & Track</h3>
              <p className="text-gray-600">
                Comment on tasks, track progress, and get real-time updates with notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-indigo-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Boost Your Team's Productivity?
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Join TaskFlow today and start managing your projects like a pro.
          </p>
          <Link 
            to="/signup" 
            className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}