import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, authAPI } from '../api';
import { useToast } from '../contexts/ToastContext';
import MemberFormModal from '../components/MemberFormModal';
import SearchBar from '../components/SearchBar';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [stats, setStats] = useState(null);
  
  const { success, error: showError } = useToast();

  // Fetch members data
  const fetchMembers = async (search = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (search.trim()) {
        params.search = search.trim();
        params.limit = 100; // Increase limit for search results
      }
      
      const response = await userAPI.getUsers(params);
      console.log(response.data)
      setMembers(response.data.users);
      setFilteredMembers(response.data.users); // Set filtered members directly
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.response?.data?.error || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await userAPI.getUserStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Handle search - now uses server-side search with debounce
  const handleSearchChange = async (term) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Debounce search requests
    window.searchTimeout = setTimeout(async () => {
      await fetchMembers(term);
    }, 300); // Wait 300ms after user stops typing
  };

  // Initial data fetch
  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, []);

  const handleAddMember = () => {
    setEditingMember(null);
    setShowModal(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      return;
    }

    try {
      await userAPI.deleteUser(member._id);
      success(`${member.name} has been deleted`);
      fetchMembers();
      fetchStats();
    } catch (err) {
      console.error('Error deleting member:', err);
      showError(err.response?.data?.error || 'Failed to delete member');
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    
    try {
      await userAPI.toggleUserStatus(member._id, newStatus);
      success(`${member.name} is now ${newStatus}`);
      fetchMembers();
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      showError(err.response?.data?.error || 'Failed to update member status');
    }
  };

  const handleFormSubmit = async (formData) => {
    setModalLoading(true);
    
    try {
      if (editingMember) {
        // Update existing member
        await userAPI.updateUser(editingMember._id, formData);
        success(`${formData.name} has been updated`);
      } else {
        // Create new member using admin register endpoint
        await authAPI.register(formData);
        success(`${formData.name} has been created successfully`);
      }
      
      setShowModal(false);
      fetchMembers();
      fetchStats();
    } catch (err) {
      console.error('Error saving member:', err);
      showError(err.response?.data?.error || 'Failed to save member');
    } finally {
      setModalLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'mentor': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600' : 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto py-6 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h1 className="text-lg font-medium text-black tracking-tight">
              Members
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/signup"
                className="px-4 sm:px-6 py-3 border border-gray-200 text-xs tracking-wider uppercase font-medium hover:bg-gray-50 transition-colors duration-200 text-center"
              >
                Register New User
              </Link>
              <button
                onClick={handleAddMember}
                className="px-4 sm:px-6 py-3 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                Add Member
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400 tracking-wider uppercase">
            <span>{members.length} total</span>
            {stats && (
              <>
                <span>•</span>
                <span>{stats.activeUsers} active</span>
                <span>•</span>
                <span>{stats.inactiveUsers} inactive</span>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />

        {/* Members Table */}
        <div className="space-y-px">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-1 h-1 bg-black animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <p className="text-xs text-red-500 tracking-wider uppercase mb-4">
                {error}
              </p>
              <button
                onClick={fetchMembers}
                className="text-xs text-gray-400 tracking-wider uppercase hover:text-black transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-xs text-gray-400 tracking-wider uppercase">
                {searchTerm ? 'No members found' : 'No members yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:flex items-center py-4 border-b border-gray-200 text-xs text-gray-400 tracking-wider uppercase">
                <div className="flex-1">Name</div>
                <div className="w-24">Role</div>
                <div className="w-24">Status</div>
                <div className="w-32">RFID</div>
                <div className="flex-1">Email</div>
                <div className="w-32">Phone</div>
                <div className="w-32">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredMembers.map((member) => (
                <div 
                  key={member._id} 
                  className="flex flex-col md:flex-row md:items-center py-6 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50/50 transition-colors duration-200"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-black">
                        {member.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs capitalize ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>{member.email}</p>
                      <p>RFID: {member.rfidTag}</p>
                      {member.phone && <p>Phone: {member.phone}</p>}
                    </div>
                    <div className="flex space-x-4 pt-2">
                      <Link
                        to={`/user/${member._id}`}
                        className="text-xs text-gray-400 hover:text-black transition-colors duration-200"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-xs text-gray-400 hover:text-black transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className="text-xs text-gray-400 hover:text-black transition-colors duration-200"
                      >
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex md:items-center md:w-full">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black tracking-tight">
                        {member.name}
                      </p>
                    </div>
                    <div className="w-24">
                      <span className={`text-xs capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="w-24">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className={`text-xs capitalize ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-32">
                      <span className="text-xs text-gray-600 font-mono">
                        {member.rfidTag}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-600">
                        {member.email}
                      </span>
                    </div>
                    <div className="w-32">
                      <span className="text-xs text-gray-600">
                        {member.phone || '—'}
                      </span>
                    </div>
                    <div className="w-32">
                      <div className="flex space-x-2">
                        <Link
                          to={`/user/${member._id}`}
                          className="text-xs text-gray-400 hover:text-black transition-colors duration-200"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleEditMember(member)}
                          className="text-xs text-gray-400 hover:text-black transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        member={editingMember}
        loading={modalLoading}
      />
    </div>
  );
};

export default Members;
