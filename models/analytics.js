import { connectToDatabase } from '../config/db.js';

export const Analytics = {
  getDashboardSummary: async () => {
    try {
      console.log('[getDashboardSummary] Fetching dashboard metrics');
      const db = await connectToDatabase();
      
      // Get today's analytics
      const [metrics] = await db.query(`
        SELECT 
          total_users,
          active_students,
          total_bookings,
          completed_bookings,
          cancelled_bookings,
          total_revenue,
          total_quizzes_attempted,
          total_lessons_completed,
          average_user_satisfaction
        FROM analytics
        ORDER BY date DESC
        LIMIT 1
      `);
      
      console.log(' [getDashboardSummary] Success');
      return metrics[0] || {};
    } catch (error) {
      console.error(' [getDashboardSummary] Error:', error.message);
      throw error;
    }
  },

  getRevenueReport: async (filters = {}) => {
    try {
      console.log(' [getRevenueReport] Fetching revenue with filters:', filters);
      const db = await connectToDatabase();
      
      const { startDate, endDate, instructorId } = filters;
      let query = `
        SELECT 
          a.date,
          a.total_bookings,
          a.completed_bookings,
          a.total_revenue
        FROM analytics a
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ` AND a.date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND a.date <= ?`;
        params.push(endDate);
      }
      
      query += ` ORDER BY a.date DESC`;
      
      const [rows] = await db.query(query, params);
      
      const totalRevenue = rows.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
      console.log(' [getRevenueReport] Total Revenue:', totalRevenue);
      
      return {
        data: rows,
        total_revenue: totalRevenue,
        record_count: rows.length
      };
    } catch (error) {
      console.error(' [getRevenueReport] Error:', error.message);
      throw error;
    }
  },

  getBookingStatistics: async (filters = {}) => {
    try {
      console.log(' [getBookingStatistics] Fetching booking stats');
      const db = await connectToDatabase();
      
      const { startDate, endDate } = filters;
      let query = `
        SELECT 
          date,
          total_bookings,
          completed_bookings,
          cancelled_bookings,
          (total_bookings - completed_bookings - cancelled_bookings) as pending_bookings
        FROM analytics
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ` AND date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND date <= ?`;
        params.push(endDate);
      }
      
      query += ` ORDER BY date DESC`;
      
      const [rows] = await db.query(query, params);
      
      console.log(' [getBookingStatistics] Success');
      return rows;
    } catch (error) {
      console.error(' [getBookingStatistics] Error:', error.message);
      throw error;
    }
  },

  getStudentEngagement: async () => {
    try {
      console.log(' [getStudentEngagement] Fetching student engagement metrics');
      const db = await connectToDatabase();
      
      const [rows] = await db.query(`
        SELECT 
          u.id,
          u.username,
          u.xp,
          u.level,
          (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = u.id) as quizzes_taken,
          (SELECT COUNT(*) FROM lesson_progress WHERE user_id = u.id AND is_completed = TRUE) as lessons_completed,
          (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badges_earned,
          (SELECT COUNT(*) FROM bookings b JOIN students s ON b.student_id = s.student_id WHERE s.user_id = u.id) as bookings_made,
          u.created_at,
          u.updated_at
        FROM users u
        WHERE u.role = 'student'
        ORDER BY u.xp DESC
      `);
      
      console.log(' [getStudentEngagement] Found', rows.length, 'students');
      return rows;
    } catch (error) {
      console.error(' [getStudentEngagement] Error:', error.message);
      throw error;
    }
  },

  getLearningPerformance: async () => {
    try {
      console.log(' [getLearningPerformance] Fetching learning performance');
      const db = await connectToDatabase();
      
      const [rows] = await db.query(`
        SELECT 
          m.module_id,
          m.title,
          m.instrument,
          COUNT(DISTINCT lp.user_id) as students_started,
          COUNT(DISTINCT CASE WHEN lp.is_completed = TRUE THEN lp.user_id END) as students_completed,
          ROUND(AVG(lp.completion_percentage), 2) as avg_completion_percentage
        FROM modules m
        LEFT JOIN lessons l ON m.module_id = l.module_id
        LEFT JOIN lesson_progress lp ON l.lesson_id = lp.lesson_id
        GROUP BY m.module_id, m.title, m.instrument
        ORDER BY students_completed DESC
      `);
      
      console.log(' [getLearningPerformance] Found', rows.length, 'modules');
      return rows;
    } catch (error) {
      console.error(' [getLearningPerformance] Error:', error.message);
      throw error;
    }
  },

  getCustomerBehavior: async () => {
    try {
      console.log(' [getCustomerBehavior] Fetching customer behavior');
      const db = await connectToDatabase();
      
      const [rows] = await db.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(DISTINCT b.booking_id) as total_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.booking_id END) as completed_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) as cancelled_bookings,
          ROUND((COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) / NULLIF(COUNT(DISTINCT b.booking_id), 0)) * 100, 2) as cancellation_rate,
          MAX(b.booking_date) as last_booking_date,
          COUNT(DISTINCT qa.attempt_id) as quiz_attempts,
          ROUND(AVG(CAST(qa.percentage AS DECIMAL(5,2))), 2) as avg_quiz_score
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN bookings b ON s.student_id = b.student_id
        LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.username
        ORDER BY completed_bookings DESC
      `);
      
      console.log(' [getCustomerBehavior] Found', rows.length, 'records');
      return rows;
    } catch (error) {
      console.error(' [getCustomerBehavior] Error:', error.message);
      throw error;
    }
  },

  logActivity: async ({ userId, action, resourceType, resourceId, ipAddress, userAgent }) => {
    try {
      console.log(' [logActivity] Logging activity:', { userId, action, resourceType });
      
      // For now, just log to console since we don't have a specific logs table
      // In production, you'd save to a separate analytics_logs table
      console.log(' [logActivity] Activity recorded:', { userId, action, resourceType, resourceId, ipAddress });
      
      return { success: true, message: 'Activity logged' };
    } catch (error) {
      console.error(' [logActivity] Error:', error.message);
      throw error;
    }
  },

  updateDailyAnalytics: async () => {
    try {
      console.log('[updateDailyAnalytics] Updating daily analytics');
      const db = await connectToDatabase();
      
      const [result] = await db.query(`
        INSERT INTO analytics (date, total_users, active_students, total_bookings, completed_bookings, cancelled_bookings, total_revenue, total_quizzes_attempted, total_lessons_completed, average_user_satisfaction, created_at)
        VALUES (
          CURDATE(),
          (SELECT COUNT(*) FROM users WHERE role = 'student'),
          (SELECT COUNT(DISTINCT user_id) FROM lesson_progress WHERE DATE(updated_at) = CURDATE()),
          (SELECT COUNT(*) FROM bookings WHERE DATE(booking_date) = CURDATE()),
          (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND DATE(booking_date) = CURDATE()),
          (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND DATE(booking_date) = CURDATE()),
          (SELECT COALESCE(SUM(hourly_rate), 0) FROM instructors JOIN bookings ON instructors.instructor_id = bookings.instructor_id WHERE DATE(booking_date) = CURDATE()),
          (SELECT COUNT(*) FROM quiz_attempts WHERE DATE(submitted_at) = CURDATE()),
          (SELECT COUNT(*) FROM lesson_progress WHERE is_completed = TRUE AND DATE(completed_at) = CURDATE()),
          (SELECT AVG(xp) FROM users WHERE role = 'student'),
          NOW()
        )
        ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          active_students = VALUES(active_students),
          total_bookings = VALUES(total_bookings),
          completed_bookings = VALUES(completed_bookings),
          cancelled_bookings = VALUES(cancelled_bookings),
          total_revenue = VALUES(total_revenue),
          total_quizzes_attempted = VALUES(total_quizzes_attempted),
          total_lessons_completed = VALUES(total_lessons_completed),
          average_user_satisfaction = VALUES(average_user_satisfaction)
      `);
      
      console.log(' [updateDailyAnalytics] Updated');
      return result;
    } catch (error) {
      console.error(' [updateDailyAnalytics] Error:', error.message);
      throw error;
    }
  }
};