import axios from 'axios';

// Dynamic API base URL that works in both development and production
const getApiBaseUrl = () => {
  // First, check if environment variable is set
  if (import.meta.env.VITE_API_URL !== undefined) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback logic: In production (when served by nginx), use relative URLs
  if (import.meta.env.PROD) {
    return ''; // This will use the same domain as the frontend
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
};

// User management API calls
export const userAPI = {
  getUsers: (params) => 
    api.get('/users', { params }),
  
  getUser: (id) => 
    api.get(`/users/${id}`),
  
  createUser: (userData) => 
    api.post('/users', userData),
  
  updateUser: (id, userData) => 
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id) => 
    api.delete(`/users/${id}`),
  
  toggleUserStatus: (id, status) => 
    api.put(`/users/${id}/status`, { status }),
  
  getUserStats: () => 
    api.get('/users/stats/summary'),
  
  // Member profile endpoints
  getMyProfile: () => 
    api.get('/users/me'),
  
  updateMyProfile: (userData) => 
    api.put('/users/me', userData),
  
  getMyAttendance: (params) => 
    api.get('/users/myAttendance', { params }),
};

// Attendance API calls
export const attendanceAPI = {
  getTodayAttendance: () => 
    api.get('/attendance/today'),
  
  getMyAttendance: (params) => 
    api.get('/attendance/my', { params }),
  
  getAttendanceHistory: (params) => 
    api.get('/attendance/history', { params }),
  
  getUserAttendance: (userId, params) => 
    api.get(`/attendance/user/${userId}`, { params }),
  
  getAttendanceStats: (params) => 
    api.get('/attendance/stats', { params }),
  
  deleteAttendance: (id) => 
    api.delete(`/attendance/${id}`),
  
  recordAttendance: (rfidTag, timestamp) => 
    api.post('/attendance', { rfidTag, timestamp }),

  // Manual attendance recording with type specification
  recordManualAttendance: (userId, timestamp, type) => 
    api.post('/attendance/manual', { userId, timestamp, type }),
};

// System API calls (utility endpoints)
export const systemAPI = {
  healthCheck: () => 
    api.get('/health'),
  
  getApiInfo: () => 
    api.get('/'),
};

// Utility functions
export const auth = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  isAdmin: () => {
    const user = auth.getUser();
    return user?.role === 'admin';
  },
  
  isMentorOrAdmin: () => {
    const user = auth.getUser();
    return user?.role === 'admin' || user?.role === 'mentor';
  },
};

export default api;
