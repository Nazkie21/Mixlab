import { connectToDatabase } from '../config/db.js';

//DASHBOARD METRICS

export const getDashboardMetrics = async (req, res) => {
  try {
    const connection = await connectToDatabase();

    const [totalUsers] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE role = "student"'
    );

    const [totalInstructors] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE role = "instructor"'
    );

    const [totalAppointments] = await connection.query(
      'SELECT COUNT(*) as count FROM bookings'
    );

    const [completedAppointments] = await connection.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"'
    );

    const [activeLessons] = await connection.query(
      'SELECT COUNT(*) as count FROM lessons WHERE 1=1'
    );

    const [avgCompletion] = await connection.query(
      'SELECT COALESCE(AVG(percentage), 0) as avg_completion FROM quiz_attempts WHERE percentage IS NOT NULL'
    );

    const [recentBookings] = await connection.query(
      `SELECT b.booking_id, u.username AS student_name, b.lesson_type AS lesson_title, 
              b.booking_date, b.status
      FROM bookings b
      JOIN students s ON b.student_id = s.student_id
      JOIN users u ON s.user_id = u.id
      ORDER BY b.booking_date DESC
      LIMIT 5`
    );

    await connection.end();

    return res.json({
      success: true,
      data: {
        overview: {
          total_students: totalUsers[0].count,
          total_instructors: totalInstructors[0].count,
          total_appointments: totalAppointments[0].count,
          completed_appointments: completedAppointments[0].count,
          active_lessons: activeLessons[0].count,
        },
        performance: {
          avg_completion_rate: parseFloat(avgCompletion[0].avg_completion).toFixed(2),
        },
        recent_bookings: recentBookings,
      },
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard metrics',
      error: error.message,
    });
  }
};

//USER MANAGEMENT 

export const getAllUsers = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase(); // Open connection

    const { role, search } = req.query;
    let query = 'SELECT id, username, email, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [users] = await connection.query(query, params); // Use once, after all setup

    return res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  } finally {
   if (connection) await connection.end(); // Always close connection safely
  }
};



export const getUserById = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;

    const [user] = await connection.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    await connection.end();

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, role',
      });
    }

    const [result] = await connection.query(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username, email, role, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User updated successfully',
      id: id,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;

    const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

// LESSON/MODULE MANAGEMENT 

export const getAllLessons = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { instrument, status } = req.query;

    let query = 'SELECT lesson_id, title, description, order_index, xp_reward, created_at FROM lessons WHERE 1=1';
    const params = [];

    if (instrument) {
      query = `SELECT l.lesson_id, l.title, l.description, l.order_index, l.xp_reward, l.created_at, m.instrument 
               FROM lessons l 
               JOIN modules m ON l.module_id = m.module_id 
               WHERE m.instrument = ?`;
      params.push(instrument);
    }

    query += ' ORDER BY created_at DESC';
    const [lessons] = await connection.query(query, params);

    await connection.end();

    return res.json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (error) {
    console.error('Get all lessons error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching lessons',
      error: error.message,
    });
  }
};

export const createLesson = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { title, description, module_id, content_url, video_url, order_index, xp_reward } = req.body;

    if (!title || !module_id) {
      // await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, module_id',
      });
    }

    const [result] = await connection.query(
      'INSERT INTO lessons (module_id, title, description, content_url, video_url, order_index, xp_reward, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [module_id, title, description, content_url || null, video_url || null, order_index || 0, xp_reward || 10]
    );

    // await connection.end();

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson_id: result.insertId,
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating lesson',
      error: error.message,
    });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;
    const { title, description, content_url, video_url, order_index, xp_reward } = req.body;

    const [result] = await connection.query(
      'UPDATE lessons SET title = ?, description = ?, content_url = ?, video_url = ?, order_index = ?, xp_reward = ? WHERE lesson_id = ?',
      [title, description, content_url || null, video_url || null, order_index, xp_reward, id]
    );

    // await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    return res.json({
      success: true,
      message: 'Lesson updated successfully',
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating lesson',
      error: error.message,
    });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;

    const [result] = await connection.query('DELETE FROM lessons WHERE lesson_id = ?', [id]);

    // await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    return res.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message,
    });
  }
};

// ============ ANALYTICS & REPORTS ============

export const generateReport = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = ' WHERE DATE(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [userCount] = await connection.query(
      'SELECT COUNT(*) as total FROM users WHERE role = "student"'
    );

    const [appointmentStats] = await connection.query(
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed, ' +
      'SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled ' +
      `FROM bookings ${dateFilter}`,
      params
    );

    // FIX: Removed revenue query (payments table doesn't exist)

    const [engagementData] = await connection.query(
      'SELECT COUNT(DISTINCT user_id) as active_students, ' +
      'COUNT(*) as total_attempts ' +
      `FROM quiz_attempts ${dateFilter}`,
      params
    );

    await connection.end();

    return res.json({
      success: true,
      data: {
        period: { start_date: start_date || 'All', end_date: end_date || 'All' },
        total_students: userCount[0].total,
        appointments: appointmentStats[0],
        engagement: engagementData[0],
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const connection = await connectToDatabase();

    
    const [topInstructors] = await connection.query(
      'SELECT u.id, u.username, COUNT(b.booking_id) as bookings ' +
      'FROM users u ' +
      'LEFT JOIN instructors i ON u.id = i.user_id ' +
      'LEFT JOIN bookings b ON i.instructor_id = b.instructor_id ' +
      'WHERE u.role = "instructor" ' +
      'GROUP BY u.id ORDER BY bookings DESC LIMIT 10'
    );

    await connection.end();

    return res.json({
      success: true,
      data: {
        top_instructors: topInstructors,
        message: 'Revenue tracking requires a payments table to be implemented'
      },
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error.message,
    });
  }
};

//  APPOINTMENT MANAGEMENT 

export const getAllAppointments = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { status, instructor_id } = req.query;

    let query = `
      SELECT 
        b.booking_id, 
        u.username AS student_name, 
        i_user.username AS instructor_name, 
        b.lesson_type, 
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status
      FROM bookings b
      JOIN students s ON b.student_id = s.student_id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN instructors i ON b.instructor_id = i.instructor_id
      LEFT JOIN users i_user ON i.user_id = i_user.id
      WHERE 1=1`;

    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (instructor_id) {
      query += ' AND b.instructor_id = ?';
      params.push(instructor_id);
    }

    query += ' ORDER BY b.booking_date DESC';
    const [appointments] = await connection.query(query, params);

    await connection.end();

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message,
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const [result] = await connection.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      [status, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.json({
      success: true,
      message: 'Booking status updated successfully',
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message,
    });
  }
};

//  INSTRUCTOR MANAGEMENT 

export const addInstructor = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const { username, email, password, first_name, last_name, specialization } = req.body;

    if (!username || !email || !password || !first_name || !last_name) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password, first_name, last_name',
      });
    }

    // Check if email already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
       await connection.end();
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Create user first
    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, password, role, created_at) ' +
      'VALUES (?, ?, ?, "instructor", NOW())',
      [username, email, password]
    );

    const userId = userResult.insertId;

    await connection.query(
      'INSERT INTO instructors (user_id, first_name, last_name, specialization, is_active, created_at) ' +
      'VALUES (?, ?, ?, ?, 1, NOW())',
      [userId, first_name, last_name, specialization || null]
    );

    await connection.end();

    return res.status(201).json({
      success: true,
      message: 'Instructor added successfully',
      user_id: userId,
    });
  } catch (error) {
    console.error('Add instructor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding instructor',
      error: error.message,
    });
  }
};

export const getInstructors = async (req, res) => {
  try {
    const connection = await connectToDatabase();

    const [instructors] = await connection.query(
      'SELECT u.id, u.username, u.email, i.first_name, i.last_name, i.specialization, i.is_active, u.created_at ' +
      'FROM users u ' +
      'JOIN instructors i ON u.id = i.user_id ' +
      'WHERE u.role = "instructor" ORDER BY u.username ASC'
    );

    await connection.end();

    return res.json({
      success: true,
      count: instructors.length,
      data: instructors,
    });
  } catch (error) {
    console.error('Get instructors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching instructors',
      error: error.message,
    });
  }
};