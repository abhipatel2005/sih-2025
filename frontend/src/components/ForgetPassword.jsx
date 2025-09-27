import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
                email: email.trim()
            });

            console.log('Password reset response:', response.data);
            setSubmitted(true);
        } catch (error) {
            console.error('Forgot password error:', error);
            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else {
                setError('An error occurred while sending the password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-lg font-medium text-black tracking-tight mb-2">
                        Forgot Password
                    </h1>
                    <p className="text-xs text-gray-400 tracking-wider uppercase">
                        Reset your password
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded">
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <input
                                type="email"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(''); // Clear error when user types
                                }}
                                className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className={`w-full py-4 text-white text-xs tracking-wider uppercase font-medium transition-colors duration-200 ${
                                    loading || !email.trim() 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-black hover:bg-gray-800'
                                }`}
                            >
                                {loading ? 'Sending...' : 'Send Password to Email'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            If an account with <span className="font-medium">{email}</span> exists,
                            you’ll receive a password reset email shortly.
                        </p>
                    </div>
                )}

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-xs text-gray-500 hover:text-black transition-colors duration-200"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
