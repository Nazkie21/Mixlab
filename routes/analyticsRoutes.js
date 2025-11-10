import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/authorize.js';
import {
  getDashboard,
  getRevenue,
  getBookings,
  getStudentEngagement,
  getLearningPerformance,
  getCustomerBehavior,
  exportReport,
  logActivity
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, authorizeRoles('admin'), getDashboard);
router.get('/revenue', authenticateToken, authorizeRoles('admin'), getRevenue);
router.get('/bookings', authenticateToken, authorizeRoles('admin'), getBookings);
router.get('/student-engagement', authenticateToken, authorizeRoles('admin'), getStudentEngagement);
router.get('/learning-performance', authenticateToken, authorizeRoles('admin'), getLearningPerformance);
router.get('/customer-behavior', authenticateToken, authorizeRoles('admin'), getCustomerBehavior);
router.get('/reports/export', authenticateToken, authorizeRoles('admin'), exportReport);
router.post('/logs', logActivity);

export default router;