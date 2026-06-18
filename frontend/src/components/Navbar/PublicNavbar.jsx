// frontend/src/components/Navbar/PublicNavbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaBars, FaTimes } from 'react-icons/fa';

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center text-xl sm:text-2xl font-bold text-indigo-600">
          <FaProjectDiagram className="mr-2" />
          <span className="hidden sm:inline">TaskFlow</span>
          <span className="sm:hidden">TaskFlow</span>
        </Link>
        
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 focus:outline-none" aria-label="Toggle menu">
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
            Login
          </Link>
          <Link to="/signup" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign Up
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden px-6 pt-2 pb-4 border-t border-gray-200">
          <Link to="/login" className="block mt-2 bg-indigo-600 text-white text-center font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
            Login
          </Link>
          <Link to="/signup" className="block mt-2 bg-indigo-600 text-white text-center font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}