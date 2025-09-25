import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userAPI, attendanceAPI } from '../api';
import { formatDateIST, formatTimeIST } from '../utils/dateUtils';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    profilePicture: '',
    skills: '',
    bio: '',
    password: '',
    confirmPassword: '',
    category: '',
    gender: '',
    std: '',
    dob: '',
    address: '',
    bloodGroup: '',
    aadharId: ''
  });
  const [errors, setErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getMyProfile();
      const userData = response.data.user;
      setProfile(userData);
      
      // Initialize form data
      setFormData({
        email: userData.email || '',
        phone: userData.phone || '',
        profilePicture: userData.profilePicture || '',
        skills: userData.skills ? userData.skills.join(', ') : '',
        bio: userData.bio || '',
        password: '',
        confirmPassword: '',
        category: userData.category || '',
        gender: userData.gender || '',
        std: userData.std || '',
        dob: userData.dob || '',
        address: userData.address || '',
        bloodGroup: userData.bloodGroup || userData.blood_group || '',
        aadharId: userData.aadharId || userData.aadhar_id || ''
      });
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      showError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setAttendanceLoading(true);
      // Get last 10 attendance records
      const response = await attendanceAPI.getMyAttendance({ limit: 10 });
      setAttendanceData(response.data.attendance || []);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      showError('Failed to load attendance history');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAttendanceHistory();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic length check)
    if (formData.phone && (formData.phone.length < 10 || formData.phone.length > 15)) {
      newErrors.phone = 'Phone number should be 10-15 characters';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Profile picture URL validation (basic)
    if (formData.profilePicture && !formData.profilePicture.startsWith('http')) {
      newErrors.profilePicture = 'Please enter a valid URL (starting with http)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      
      // Prepare update data with correct field mapping
      const updateData = {
        email: formData.email,
        phone: formData.phone,
        profilePicture: formData.profilePicture,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [],
        bio: formData.bio,
        category: formData.category,
        gender: formData.gender,
        std: formData.std,
        dob: formData.dob,
        address: formData.address,
        blood_group: formData.bloodGroup,
        aadhar_id: formData.aadharId
      };

      // Add password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await userAPI.updateMyProfile(updateData);
      const updatedProfile = response.data.user;
      
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Update user in auth context if needed
      if (updateUser) {
        updateUser(updatedProfile);
      }
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
      success('Profile updated successfully');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      showError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    
    // Reset form data to original profile values
    setFormData({
      email: profile.email || '',
      phone: profile.phone || '',
      profilePicture: profile.profilePicture || '',
      skills: profile.skills ? profile.skills.join(', ') : '',
      bio: profile.bio || '',
      password: '',
      confirmPassword: '',
      category: profile.category || '',
      gender: profile.gender || '',
      std: profile.std || '',
      dob: profile.dob || '',
      address: profile.address || '',
      bloodGroup: profile.bloodGroup || profile.blood_group || '',
      aadharId: profile.aadharId || profile.aadhar_id || ''
    });
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 tracking-wider uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-black tracking-tight">
              Profile
            </h1>
            <p className="text-xs text-gray-400 tracking-wider uppercase mt-1">
              Manage your personal information
            </p>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto bg-black text-white px-4 sm:px-6 py-2 text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="bg-gray-50 border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">
                Profile Picture
              </h2>
              
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
                  {formData.profilePicture ? (
                    <img 
                      src={formData.profilePicture} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <span className="text-lg sm:text-xl font-medium text-gray-400">
                      {profile?.name?.charAt(0)}
                    </span>
                  )}
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                    <span className="text-lg sm:text-xl font-medium text-gray-400">
                      {profile?.name?.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  {errors.profilePicture && (
                    <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="+1234567890"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                  >
                    <option value="">Select Category</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                    <option value="ews">EWS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
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
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Class/Standard
                  </label>
                  <input
                    type="text"
                    name="std"
                    value={formData.std}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="e.g., 10th, 12th"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Aadhar ID
                  </label>
                  <input
                    type="text"
                    name="aadharId"
                    value={formData.aadharId}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="12-digit Aadhar number"
                    maxLength="12"
                    pattern="[0-9]{12}"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="Your address"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">
                Professional Information
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="JavaScript, React, Node.js, MongoDB"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-black tracking-tight mb-4 sm:mb-6">
                Change Password
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                    placeholder="Leave blank to keep current password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={updating}
                className="flex-1 bg-black text-white px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={updating}
                className="flex-1 border border-gray-300 text-black px-4 sm:px-6 py-3 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Profile Picture Section */}
            <div className="bg-gray-50 border border-gray-100 p-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-medium text-gray-400">
                      {profile?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div>
                  <h2 className="text-xl font-medium text-black tracking-tight">
                    {profile?.name}
                  </h2>
                  <p className="text-xs text-gray-400 tracking-wider uppercase">
                    {profile?.role} • ID: {profile?.rfidTag}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Member since {formatDate(profile?.joinedDate || profile?.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-gray-100 p-6">
              <h2 className="text-lg font-medium text-black tracking-tight mb-6">
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Email Address
                  </label>
                  <p className="text-sm text-black">{profile?.email}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Phone Number
                  </label>
                  <p className="text-sm text-black">{profile?.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Date of Birth
                  </label>
                  <p className="text-sm text-black">{profile?.dob ? formatDate(profile.dob) : 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Gender
                  </label>
                  <p className="text-sm text-black capitalize">{profile?.gender || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Category
                  </label>
                  <p className="text-sm text-black uppercase">{profile?.category || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Blood Group
                  </label>
                  <p className="text-sm text-black">{profile?.bloodGroup || profile?.blood_group || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Class/Standard
                  </label>
                  <p className="text-sm text-black">{profile?.std || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Aadhar ID
                  </label>
                  <p className="text-sm text-black font-mono">{profile?.aadharId || profile?.aadhar_id || 'Not provided'}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Address
                  </label>
                  <p className="text-sm text-black">{profile?.address || 'Not provided'}</p>
                </div>
                
                {profile?.school && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                      School
                    </label>
                    <p className="text-sm text-black">{profile.school.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white border border-gray-100 p-6">
              <h2 className="text-lg font-medium text-black tracking-tight mb-6">
                Professional Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Skills
                  </label>
                  {profile?.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 px-3 py-1 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No skills added yet</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Bio
                  </label>
                  <p className="text-sm text-black whitespace-pre-wrap">
                    {profile?.bio || 'No bio added yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white border border-gray-100 p-6">
              <h2 className="text-lg font-medium text-black tracking-tight mb-6">
                Account Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                    profile?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Account Created
                  </label>
                  <p className="text-sm text-black">{formatDate(profile?.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 tracking-wider uppercase mb-2">
                    Last Updated
                  </label>
                  <p className="text-sm text-black">{formatDate(profile?.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-black tracking-tight">
                  Attendance History
                </h2>
                <p className="text-xs text-gray-400 tracking-wider uppercase">
                  Last 10 records
                </p>
              </div>
              
              {attendanceLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-1 h-1 bg-black animate-pulse"></div>
                </div>
              ) : attendanceData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider uppercase">
                          Time
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 tracking-wider uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceData.map((record, index) => {
                        const status = record.status || 'present';
                        
                        // Helper function to get status badge color
                        const getStatusBadgeColor = (status) => {
                          switch (status?.toLowerCase()) {
                            case 'present':
                              return 'bg-green-100 text-green-800';
                            case 'absent':
                              return 'bg-red-100 text-red-800';
                            case 'late':
                              return 'bg-yellow-100 text-yellow-800';
                            case 'excused':
                              return 'bg-blue-100 text-blue-800';
                            default:
                              return 'bg-gray-100 text-gray-800';
                          }
                        };
                        
                        return (
                          <tr key={record._id || record.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-4 py-3 text-sm text-black">
                              {formatDateIST(record.date, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-black font-mono">
                              {record.timestamp ? formatTimeIST(record.timestamp) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(status)}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 tracking-wider uppercase">
                    No attendance records found
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Your attendance history will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
