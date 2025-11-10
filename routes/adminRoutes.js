// adminRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  authorizeRoles,
  validateCreateLesson,
  validateUpdateUser,
  validateAddInstructor,
  validateDateRange,
  validatePagination,
  rateLimit,
} from '../middleware/authorize.js';
import {
  // Dashboard
  getDashboardMetrics,

  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

  // Lesson/Module Management
  getAllLessons,
  createLesson,
  updateLesson,
  deleteLesson,

  // Analytics & Reports
  generateReport,
  getRevenueAnalytics,

  // Appointment Management
  getAllAppointments,
  updateAppointmentStatus,

  // Instructor Management
  addInstructor,
  getInstructors,
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and rate limiting to all admin routes
router.use(authenticateToken);
router.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
router.use(authorizeRoles('admin'));

// ============ DASHBOARD ============
/**
 * GET /api/admin/dashboard
 * Retrieves comprehensive dashboard metrics
 */
router.get('/dashboard', getDashboardMetrics);

// ============ USER MANAGEMENT ============
/**
 * GET /api/admin/users
 * Retrieves all users with optional filters and pagination
 * Query params: ?role=student&search=John&page=1&limit=20
 */
router.get('/users', validatePagination, getAllUsers);

/**
 * GET /api/admin/users/:id
 * Retrieves a specific user by ID
 */
router.get('/users/:id', getUserById);

/**
 * PUT /api/admin/users/:id
 * Updates user information (name, email, role)
 * Body: { name, email, role }
 */
router.put('/users/:id', validateUpdateUser, updateUser);

/**
 * DELETE /api/admin/users/:id
 * Deletes a user from the system
 */
router.delete('/users/:id', deleteUser);

// ============ LESSON/MODULE MANAGEMENT ============
/**
 * GET /api/admin/lessons
 * Retrieves all lessons/modules with optional filters and pagination
 * Query params: ?instrument=piano&status=active&page=1&limit=20
 */
router.get('/lessons', validatePagination, getAllLessons);

/**
 * POST /api/admin/lessons
 * Creates a new lesson/module
 * Body: { title, description, instrument, difficulty_level, content_url }
 */
router.post('/lessons', validateCreateLesson, createLesson);

/**
 * PUT /api/admin/lessons/:id
 * Updates an existing lesson/module
 * Body: { title, description, instrument, difficulty_level, content_url, is_active }
 */
router.put('/lessons/:id', validateCreateLesson, updateLesson);

/**
 * DELETE /api/admin/lessons/:id
 * Deletes a lesson/module from the system
 */
router.delete('/lessons/:id', deleteLesson);

// ============ ANALYTICS & REPORTS ============
/**
 * GET /api/admin/reports
 * Generates comprehensive analytics reports
 * Query params: ?start_date=2024-01-01&end_date=2024-12-31&report_type=detailed
 */
router.get('/reports', validateDateRange, generateReport);

/**
 * GET /api/admin/analytics/revenue
 * Retrieves revenue analytics including monthly trends and top instructors
 * Query params: ?start_date=2024-01-01&end_date=2024-12-31
 */
router.get('/analytics/revenue', validateDateRange, getRevenueAnalytics);

// ============ APPOINTMENT MANAGEMENT ============
/**
 * GET /api/admin/appointments
 * Retrieves all appointments with optional filters and pagination
 * Query params: ?status=completed&instructor_id=5&page=1&limit=20
 */
router.get('/appointments', validatePagination, getAllAppointments);

/**
 * PUT /api/admin/appointments/:id/status
 * Updates appointment status
 * Body: { status } - one of: pending, confirmed, completed, cancelled
 */
router.put('/appointments/:id/status', updateAppointmentStatus);

// ============ INSTRUCTOR MANAGEMENT ============

router.get('/instructors', validatePagination, getInstructors);

/**
 * POST /api/admin/instructors
 * Adds a new instructor
 * Body: { name, email, password, specialization }
 */
router.post('/instructors', validateAddInstructor, addInstructor);

export default router;