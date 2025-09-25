import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-lg font-medium text-black tracking-tight mb-2">
            Login
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Attendee1
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Field */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="py-4">
              <p className="text-xs text-red-500 tracking-wider uppercase">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Default Credentials Info */}
        {/* <div className="mt-16 p-6 bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-400 tracking-wider uppercase mb-4">
            Default Admin Credentials
          </p>
          <div className="space-y-2 text-xs text-gray-600">
            <p><span className="font-medium">Email:</span> admin@launchlog.com</p>
            <p><span className="font-medium">Password:</span> admin123456</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Please change the password after first login
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
