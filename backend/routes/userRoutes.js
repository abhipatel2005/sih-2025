const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware, adminOrMentorMiddleware, teacherOrPrincipalMiddleware } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const router = express.Router();

// GET /users - List all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;
    
    // Build filter conditions
    const conditions = {};
    if (status) conditions.status = status;
    if (role) conditions.role = role;
    
    let query = supabase.from('users').select('*');
    
    // Apply filters
    if (status) query = query.eq('status', status);
    if (role) query = query.eq('role', role);
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,rfid_tag.ilike.%${search}%`);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get users with pagination
    const { data: users, error: usersError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (usersError) throw usersError;

    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: sanitizedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// GET /users/students - List students for teachers (teacher access)
router.get('/students', authMiddleware, teacherOrPrincipalMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    
    let query = supabase
      .from('users')
      .select('id, name, email, rfid_tag, role, created_at, school_id')
      .eq('role', 'student') // Only get students
      .eq('school_id', req.user.school_id); // Filter by teacher's school
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,rfid_tag.ilike.%${search}%`);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get students with pagination
    const { data: users, error: usersError, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (usersError) throw usersError;

    res.json({
      users: users || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        totalUsers: count || 0,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error while fetching students' });
  }
});

// GET /me - Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error while fetching user profile' });
  }
});

// PUT /me - Update current user's profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { email, phone, profile_picture, address, category, gender, std, blood_group, dob, password } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for email conflicts (if email is being changed)
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      user.email = email;
    }

    // Update allowed fields
    if (phone !== undefined) user.phone = phone;
    if (profile_picture !== undefined) user.profile_picture = profile_picture;
    if (address !== undefined) user.address = address;
    if (category !== undefined) user.category = category;
    if (gender !== undefined) user.gender = gender;
    if (std !== undefined) user.std = std;
    if (blood_group !== undefined) user.blood_group = blood_group;
    if (dob !== undefined) user.dob = dob;
    
    // Handle password update
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      user.password = password;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

// GET /users/:id - Get user by ID (admin/mentor only)
router.get('/:id', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });

  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    res.status(500).json({ error: 'Server error while fetching user' });
  }
});

// POST /users/students - Create new student (teacher/principal access)
router.post('/students', authMiddleware, teacherOrPrincipalMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      rfidTag, 
      email, 
      password, 
      phone,
      category,
      gender,
      std,
      dob,
      address,
      blood_group,
      aadhar_id
    } = req.body;

    // Validate required fields
    if (!name || !rfidTag || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, rfidTag, email, password' 
      });
    }

    // Force role to student for this endpoint
    const role = 'student';

    // Get school_id from the authenticated teacher/principal
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(400).json({ error: 'Teacher must be associated with a school' });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByRfid = await User.findByRfidTag(rfidTag);
    if (existingUserByRfid) {
      return res.status(400).json({ error: 'User with this RFID tag already exists' });
    }

    // Create new student
    const user = new User({
      name,
      rfid_tag: rfidTag,
      email,
      password,
      phone,
      role,
      category,
      gender,
      std,
      dob,
      address,
      blood_group,
      aadhar_id,
      school_id,
      status: null
    });

    await user.save();

    res.status(201).json({
      message: 'Student created successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Create student error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      const detail = error.detail || '';
      let field = 'field';
      if (detail.includes('email')) field = 'email';
      if (detail.includes('rfid_tag')) field = 'RFID tag';
      return res.status(400).json({ error: `Duplicate ${field}` });
    }
    
    res.status(500).json({ error: 'Server error during student creation' });
  }
});

// POST /users - Create new user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      rfidTag, 
      email, 
      password, 
      phone, 
      role = 'student',
      category,
      gender,
      std,
      dob,
      address,
      blood_group,
      aadhar_id,
      school_id
    } = req.body;

    // Validate required fields
    if (!name || !rfidTag || !email || !password || !school_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, rfidTag, email, password, school_id' 
      });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByRfid = await User.findByRfidTag(rfidTag);
    if (existingUserByRfid) {
      return res.status(400).json({ error: 'User with this RFID tag already exists' });
    }

    // Validate role
    if (!['student', 'teacher', 'principal', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student, teacher, principal, or admin' });
    }

    // Create new user
    const user = new User({
      name,
      rfidTag,
      email,
      password,
      phone,
      role,
      category,
      gender,
      std,
      dob,
      address,
      blood_group,
      aadhar_id,
      school_id,
      status: null
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      const detail = error.detail || '';
      let field = 'field';
      if (detail.includes('email')) field = 'email';
      if (detail.includes('rfid_tag')) field = 'RFID tag';
      return res.status(400).json({ error: `Duplicate ${field}` });
    }
    
    res.status(500).json({ error: 'Server error during user creation' });
  }
});

// PUT /users/:id - Update user (admin/mentor only)
router.put('/:id', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rfidTag, email, phone, role, status, profile_picture, skills, bio, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for email conflicts (if email is being changed)
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      user.email = email;
    }

    // Check for RFID conflicts (if RFID is being changed)
    if (rfidTag && rfidTag !== user.rfid_tag) {
      const existingUserByRfid = await User.findByRfidTag(rfidTag);
      if (existingUserByRfid) {
        return res.status(400).json({ error: 'User with this RFID tag already exists' });
      }
      user.rfid_tag = rfidTag;
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role && ['member', 'admin', 'mentor'].includes(role)) user.role = role;
    if (status && ['active', 'inactive'].includes(status)) user.status = status;
    if (profile_picture !== undefined) user.profile_picture = profile_picture;
    if (skills !== undefined) user.skills = skills;
    if (bio !== undefined) user.bio = bio;

    // Handle password update
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      user.password = password;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    if (error.code === '23505') { // Unique constraint violation
      const detail = error.detail || '';
      let field = 'field';
      if (detail.includes('email')) field = 'email';
      if (detail.includes('rfid_tag')) field = 'RFID tag';
      return res.status(400).json({ error: `Duplicate ${field}` });
    }
    
    res.status(500).json({ error: 'Server error while updating user' });
  }
});

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    res.status(500).json({ error: 'Server error while deleting user' });
  }
});

// PUT /users/:id/status - Toggle user status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({
      message: `User status updated to ${status}`,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    res.status(500).json({ error: 'Server error while updating user status' });
  }
});

// GET /users/stats/summary - Get user statistics (admin/mentor only)
router.get('/stats/summary', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('users')
      .select('status')
      .neq('role', 'admin'); // Exclude admins from attendance stats

    if (statusError) throw statusError;

    const activeUsers = statusCounts.filter(u => u.status === 'active').length;
    const inactiveUsers = statusCounts.filter(u => u.status === 'inactive').length;

    // Get counts by role
    const { data: roleCounts, error: roleError } = await supabase
      .from('users')
      .select('role');

    if (roleError) throw roleError;

    const members = roleCounts.filter(u => u.role === 'member').length;
    const mentors = roleCounts.filter(u => u.role === 'mentor').length;
    const admins = roleCounts.filter(u => u.role === 'admin').length;

    // Get total user count
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const stats = {
      total: totalUsers,
      byStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      byRole: {
        member: members,
        mentor: mentors,
        admin: admins
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error while fetching user statistics' });
  }
});

module.exports = router;
