const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware, adminOrMentorMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /users - List all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rfidTag: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// GET /me - Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error while fetching user profile' });
  }
});

// PUT /me - Update current user's profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { email, phone, profilePicture, skills, bio, password } = req.body;
    
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
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (skills !== undefined) user.skills = skills;
    if (bio !== undefined) user.bio = bio;
    
    // Handle password update
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      user.password = password; // Will be hashed by the pre-save middleware
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update current user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// GET /myAttendance - Get current user's attendance logs
router.get('/myAttendance', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Build date filter
    const dateFilter = { userId: req.user.id };
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.timestamp.$lte = end;
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get attendance records
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find(dateFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Attendance.countDocuments(dateFilter);
    
    res.json({
      attendance: attendanceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Server error while fetching attendance records' });
  }
});

// GET /users/:id - Get a single user
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Admin can see any user, others can only see themselves
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error while fetching user' });
  }
});

// POST /users - Create user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, rfidTag, email, password, phone, role = 'member', status = 'active' } = req.body;

    // Validate required fields
    if (!name || !rfidTag || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, rfidTag, email, password' 
      });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByRfid = await User.findOne({ rfidTag });
    if (existingUserByRfid) {
      return res.status(400).json({ error: 'User with this RFID tag already exists' });
    }

    // Validate role and status
    if (!['member', 'admin', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be member, admin, or mentor' });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    // Create new user
    const user = new User({
      name,
      rfidTag,
      email,
      password,
      phone,
      role,
      status
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Server error during user creation' });
  }
});

// PUT /users/:id - Edit user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rfidTag, email, phone, role, status } = req.body;

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
    }

    // Check for RFID conflicts (if RFID is being changed)
    if (rfidTag && rfidTag !== user.rfidTag) {
      const existingUserByRfid = await User.findOne({ rfidTag });
      if (existingUserByRfid) {
        return res.status(400).json({ error: 'User with this RFID tag already exists' });
      }
    }

    // Validate role and status if provided
    if (role && !['member', 'admin', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be member, admin, or mentor' });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    // Update user fields
    if (name) user.name = name;
    if (rfidTag) user.rfidTag = rfidTag;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Server error during user update' });
  }
});

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error during user deletion' });
  }
});

// PUT /users/:id/status - Toggle user status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id && status === 'inactive') {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Server error during status update' });
  }
});

// GET /users/stats/summary - Get user statistics (admin/mentor only)
router.get('/stats/summary', authMiddleware, adminOrMentorMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const roleStats = {};
    usersByRole.forEach(item => {
      roleStats[item._id] = item.count;
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: roleStats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error while fetching user statistics' });
  }
});

module.exports = router;
