// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/auth',
});

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/forgot-password', { email });
      toast.success('Password reset OTP has been sent to your email.');
      navigate('/reset-password', { state: { email: email } });
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send OTP. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6'>
        
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-800'>Forgot Password?</h1>
          <p className='text-gray-500 mt-2'>Enter your email to receive a reset code.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor="email" className='block text-sm font-medium text-gray-700'>Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors duration-300'
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>


        <div className='text-center'>
          <p className='text-sm text-gray-600'>Remembered your password? {' '}
            <Link to="/login" className='font-semibold text-indigo-600 hover:underline'>Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
