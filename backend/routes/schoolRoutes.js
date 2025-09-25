const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const router = express.Router();

// GET /schools - List all schools
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = supabase.from('schools').select('*');
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%`);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get schools with pagination
    const { data: schools, error: schoolsError, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (schoolsError) throw schoolsError;

    res.json({
      schools,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalSchools: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Server error while fetching schools' });
  }
});

// GET /schools/:id - Get specific school by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('school_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'School not found' });
      }
      throw error;
    }

    res.json({ school });

  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ error: 'Server error while fetching school' });
  }
});

// POST /schools - Create new school (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, district, state } = req.body;

    // Validate required fields
    if (!name || !district || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, district, state' 
      });
    }

    // Check if school already exists
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('school_id')
      .eq('name', name)
      .eq('district', district)
      .eq('state', state)
      .single();

    if (existingSchool) {
      return res.status(400).json({ error: 'School with this name, district, and state already exists' });
    }

    // Create new school
    const { data: school, error } = await supabase
      .from('schools')
      .insert({ name, district, state })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'School created successfully',
      school
    });

  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ error: 'Server error while creating school' });
  }
});

// PUT /schools/:id - Update school (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, district, state } = req.body;

    // Validate at least one field is provided
    if (!name && !district && !state) {
      return res.status(400).json({ error: 'At least one field (name, district, state) must be provided' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;

    const { data: school, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('school_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'School not found' });
      }
      throw error;
    }

    res.json({
      message: 'School updated successfully',
      school
    });

  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ error: 'Server error while updating school' });
  }
});

// DELETE /schools/:id - Delete school (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if school has users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('school_id', id)
      .limit(1);

    if (usersError) throw usersError;

    if (users && users.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete school with existing users. Please reassign or delete users first.' 
      });
    }

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('school_id', id);

    if (error) throw error;

    res.json({
      message: 'School deleted successfully'
    });

  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ error: 'Server error while deleting school' });
  }
});

// GET /schools/:id/stats - Get school statistics
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get school info
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('school_id', id)
      .single();

    if (schoolError) {
      if (schoolError.code === 'PGRST116') {
        return res.status(404).json({ error: 'School not found' });
      }
      throw schoolError;
    }

    // Get all users in this school
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .eq('school_id', id);

    if (usersError) throw usersError;

    // Get attendance records for this school's users
    let attendanceQuery = supabase
      .from('attendance')
      .select(`
        id,
        date,
        users!inner (
          id,
          role,
          school_id
        )
      `)
      .eq('users.school_id', id);

    // Apply date filters
    if (startDate) {
      attendanceQuery = attendanceQuery.gte('date', startDate);
    }
    if (endDate) {
      attendanceQuery = attendanceQuery.lte('date', endDate);
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

    if (attendanceError) throw attendanceError;

    // Calculate statistics
    const totalUsers = users.length;
    const uniqueUsersPresent = [...new Set(attendanceRecords.map(record => record.users.id))].length;
    const attendanceRate = totalUsers > 0 ? ((uniqueUsersPresent / totalUsers) * 100).toFixed(2) : 0;

    // Group by role
    const statsByRole = {};
    ['student', 'teacher', 'principal'].forEach(role => {
      const roleUsers = users.filter(user => user.role === role);
      const roleAttendance = attendanceRecords.filter(record => record.users.role === role);
      const uniqueRoleUsersPresent = [...new Set(roleAttendance.map(record => record.users.id))].length;
      
      statsByRole[role] = {
        totalUsers: roleUsers.length,
        presentUsers: uniqueRoleUsersPresent,
        attendanceRate: roleUsers.length > 0 ? ((uniqueRoleUsersPresent / roleUsers.length) * 100).toFixed(2) : 0,
        totalRecords: roleAttendance.length
      };
    });

    res.json({
      school,
      statistics: {
        overall: {
          totalUsers,
          presentUsers: uniqueUsersPresent,
          absentUsers: totalUsers - uniqueUsersPresent,
          attendanceRate: parseFloat(attendanceRate),
          totalAttendanceRecords: attendanceRecords.length
        },
        byRole: statsByRole,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });

  } catch (error) {
    console.error('Get school stats error:', error);
    res.status(500).json({ error: 'Server error while calculating school statistics' });
  }
});

module.exports = router;
