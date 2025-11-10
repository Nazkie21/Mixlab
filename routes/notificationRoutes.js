import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for authenticated user
router.get('/', authenticateToken, getNotifications);

// Send a new notification
router.post('/', authenticateToken, sendNotification);

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, markAllAsRead);

// Mark specific notification as read
router.put('/:notification_id/mark-read', authenticateToken, markAsRead);

// Delete all notifications
router.delete('/', authenticateToken, deleteAllNotifications);

// Delete specific notification
router.delete('/:notification_id', authenticateToken, deleteNotification);

export default router;