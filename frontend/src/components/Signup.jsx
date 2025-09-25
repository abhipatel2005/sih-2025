import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, schoolAPI } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rfidTag: '',
    role: 'student',
    phone: '',
    category: '',
    gender: '',
    std: '',
    dob: '',
    address: '',
    bloodGroup: '',
    aadharId: '',
    schoolId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // Fetch schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        const response = await schoolAPI.getSchools();
        setSchools(response.data.schools || []);
      } catch (err) {
        console.error('Error fetching schools:', err);
        showError('Failed to load schools');
      } finally {
        setSchoolsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSchools();
    }
  }, [user, showError]);

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/attendance');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirm password is required';
    if (!formData.rfidTag.trim()) newErrors.rfidTag = 'RFID tag is required';
    if (!formData.schoolId.trim()) newErrors.schoolId = 'School is required';
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      
      // Map frontend field names to backend schema field names
      const submitData = {
        name: data.name,
        email: data.email,
        password: data.password,
        rfidTag: data.rfidTag,
        role: data.role,
        phone: data.phone,
        category: data.category,
        gender: data.gender,
        std: data.std,
        dob: data.dob,
        address: data.address,
        blood_group: data.bloodGroup,
        aadhar_id: data.aadharId,
        school_id: data.schoolId,
      };
      
      await authAPI.register(submitData);
      
      success(`${formData.name} has been registered successfully`);
      navigate('/members');
    } catch (err) {
      console.error('Registration error:', err);
      showError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-medium text-black mb-4">Access Denied</h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase mb-8">
            Only administrators can register new users
          </p>
          <Link 
            to="/attendance" 
            className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16 text-center">
          <h1 className="text-lg font-medium text-black tracking-tight mb-4">
            Register New User
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Create a new member account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.name && (
              <p className="mt-2 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.email && (
              <p className="mt-2 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* RFID Tag */}
          <div>
            <input
              type="text"
              name="rfidTag"
              placeholder="RFID Tag (e.g. 04A1B2C3)"
              value={formData.rfidTag}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.rfidTag ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.rfidTag && (
              <p className="mt-2 text-xs text-red-500">{errors.rfidTag}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.password && (
              <p className="mt-2 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {/* Role */}
          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* School Selection */}
          <div>
            <select
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              disabled={loading || schoolsLoading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.schoolId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            >
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school.school_id} value={school.school_id}>
                  {school.name}
                </option>
              ))}
            </select>
            {errors.schoolId && (
              <p className="mt-2 text-xs text-red-500">{errors.schoolId}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              disabled={loading}
              placeholder="Date of Birth"
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {/* Gender */}
          <div>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            >
              <option value="">Select Category</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
            </select>
          </div>

          {/* Standard/Class (for students) */}
          {formData.role === 'student' && (
            <div>
              <input
                type="text"
                name="std"
                placeholder="Class/Standard (e.g., 10th, 12th)"
                value={formData.std}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
              />
            </div>
          )}

          {/* Blood Group */}
          <div>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Aadhar ID */}
          <div>
            <input
              type="text"
              name="aadharId"
              placeholder="Aadhar ID (12 digits)"
              value={formData.aadharId}
              onChange={handleChange}
              disabled={loading}
              maxLength="12"
              pattern="[0-9]{12}"
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {/* Address */}
          <div>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-8">
            <Link
              to="/members"
              className="flex-1 py-4 border border-gray-200 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
