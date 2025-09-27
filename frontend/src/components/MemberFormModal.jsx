import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { schoolAPI } from '../api';

const MemberFormModal = ({ isOpen, onClose, onSubmit, member = null, loading = false, restrictToStudents = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rfidTag: '',
    role: 'student',
    status: '',
    phone: '',
    category: '',
    gender: '',
    std: '',
    dob: '',
    address: '',
    blood_group: '',
    aadhar_id: '',
    school_id: ''
  });
  const [errors, setErrors] = useState({});
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const { error: showError } = useToast();

  // Fetch schools for the dropdown
  const fetchSchools = async () => {
    try {
      setSchoolsLoading(true);
      const response = await schoolAPI.getSchools();
      setSchools(response.data.schools || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
      showError('Failed to fetch schools');
    } finally {
      setSchoolsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
    }
  }, [isOpen]);

  useEffect(() => {
    if (member) {
      // Editing existing member
      setFormData({
        name: member.name || '',
        email: member.email || '',
        password: '', // Don't pre-fill password
        rfidTag: member.rfid_tag || member.rfidTag || '',
        role: member.role || 'student',
        status: member.status || '',
        phone: member.phone || '',
        category: member.category || '',
        gender: member.gender || '',
        std: member.std || '',
        dob: member.dob ? member.dob.split('T')[0] : '', // Format date for input
        address: member.address || '',
        blood_group: member.blood_group || '',
        aadhar_id: member.aadhar_id || '',
        school_id: member.school_id || ''
      });
    } else {
      // Creating new member
      setFormData({
        name: '',
        email: '',
        password: '',
        rfidTag: '',
        role: 'student',
        status: '',
        phone: '',
        category: '',
        gender: '',
        std: '',
        dob: '',
        address: '',
        blood_group: '',
        aadhar_id: '',
        school_id: ''
      });
    }
    setErrors({});
  }, [member, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Format Aadhaar ID with spaces for better readability
    if (name === 'aadhar_id') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');
      // Add spaces after every 4 digits, max 12 digits
      if (digitsOnly.length <= 12) {
        processedValue = digitsOnly.replace(/(.{4})(?=.)/g, '$1 ').trim();
      } else {
        return; // Don't update if more than 12 digits
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.rfidTag.trim()) newErrors.rfidTag = 'RFID tag is required';
    if (!formData.school_id) newErrors.school_id = 'School is required';
    
    // Password is required only for new members
    if (!member && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Phone validation (only if provided)
    if (formData.phone && !/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Aadhar validation (only if provided)
    if (formData.aadhar_id && !/^\d{12}$/.test(formData.aadhar_id.replace(/\s/g, ''))) {
      newErrors.aadhar_id = 'Aadhar ID must be 12 digits';
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

    try {
      const submitData = { ...formData };
      
      // Clean up aadhar_id (remove spaces)
      if (submitData.aadhar_id) {
        submitData.aadhar_id = submitData.aadhar_id.replace(/\s/g, '');
      }
      
      // Don't include password if it's empty (for updates)
      if (!submitData.password) {
        delete submitData.password;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        // className="absolute inset-0 bg-black bg-opacity-20" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border border-gray-200 shadow-lg max-w-lg w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-black tracking-tight">
              {member ? 'Edit Member' : (restrictToStudents ? 'Add Student' : 'Add Member')}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-black transition-colors duration-200 disabled:opacity-50"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              placeholder={member ? "Password (leave blank to keep current)" : "Password"}
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

          {/* Phone */}
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.phone && (
              <p className="mt-2 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <input
              type="date"
              name="dob"
              placeholder="Date of Birth"
              value={formData.dob}
              onChange={handleChange}
              disabled={loading}
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
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
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
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Standard/Class (for students) */}
          {formData.role === 'student' && (
            <div>
              <input
                type="text"
                name="std"
                placeholder="Standard/Class (e.g. 10th, 12th)"
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
              name="blood_group"
              value={formData.blood_group}
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

          {/* Aadhaar ID */}
          <div>
            <input
              type="text"
              name="aadhar_id"
              placeholder="Aadhaar ID (e.g. 1234 5678 9012)"
              value={formData.aadhar_id}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.aadhar_id ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            />
            {errors.aadhar_id && (
              <p className="mt-2 text-xs text-red-500">{errors.aadhar_id}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <textarea
              name="address"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              rows="3"
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 resize-none"
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
              {!restrictToStudents && (
                <>
                  <option value="teacher">Teacher</option>
                  <option value="principal">Principal</option>
                  <option value="admin">Admin</option>
                </>
              )}
            </select>
          </div>

          {/* School Selection */}
          <div>
            <select
              name="school_id"
              value={formData.school_id}
              onChange={handleChange}
              disabled={loading || schoolsLoading}
              className={`w-full border-0 border-b bg-transparent py-4 text-sm focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50 ${
                errors.school_id ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-black'
              }`}
            >
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school.school_id} value={school.school_id}>
                  {school.name}
                </option>
              ))}
            </select>
            {errors.school_id && (
              <p className="mt-2 text-xs text-red-500">{errors.school_id}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-0 border-b border-gray-200 bg-transparent py-4 text-sm focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200 disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 border border-gray-200 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (member ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberFormModal;
