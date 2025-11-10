import { connectToDatabase } from '../config/db.js';

export const Notification = {
  create: async ({ userId, title, message, type = 'system' }) => {
    try {
      console.log(' [Notification.create] Creating notification for user:', userId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())',
        [userId, title, message, type]
      );
      
      console.log(' [Notification.create] Created with ID:', result.insertId);
      return {
        notification_id: result.insertId,
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date()
      };
    } catch (error) {
      console.error(' [Notification.create] Error:', error.message);
      throw error;
    }
  },

  getAllByUser: async (userId) => {
    try {
      console.log(' [Notification.getAllByUser] Fetching notifications for user:', userId);
      const db = await connectToDatabase();
      
      const [rows] = await db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      
      console.log(' [Notification.getAllByUser] Found', rows.length, 'notifications');
      return rows || [];
    } catch (error) {
      console.error(' [Notification.getAllByUser] Error:', error.message);
      throw error;
    }
  },

  getUnreadCount: async (userId) => {
    try {
      console.log(' [Notification.getUnreadCount] Checking unread for user:', userId);
      const db = await connectToDatabase();
      
      const [rows] = await db.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      
      return rows[0]?.unread_count || 0;
    } catch (error) {
      console.error(' [Notification.getUnreadCount] Error:', error.message);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      console.log(' [Notification.markAsRead] Marking as read:', notificationId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE notification_id = ?',
        [notificationId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Notification not found');
      }
      
      console.log(' [Notification.markAsRead] Success');
      return result;
    } catch (error) {
      console.error(' [Notification.markAsRead] Error:', error.message);
      throw error;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      console.log(' [Notification.markAllAsRead] Marking all as read for user:', userId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      
      console.log(' [Notification.markAllAsRead] Marked', result.affectedRows, 'notifications');
      return result;
    } catch (error) {
      console.error(' [Notification.markAllAsRead] Error:', error.message);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      console.log(' [Notification.deleteNotification] Deleting:', notificationId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'DELETE FROM notifications WHERE notification_id = ?',
        [notificationId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Notification not found');
      }
      
      console.log(' [Notification.deleteNotification] Success');
      return result;
    } catch (error) {
      console.error(' [Notification.deleteNotification] Error:', error.message);
      throw error;
    }
  },

  deleteAllByUser: async (userId) => {
    try {
      console.log(' [Notification.deleteAllByUser] Deleting all for user:', userId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );
      
      console.log(' [Notification.deleteAllByUser] Deleted', result.affectedRows, 'notifications');
      return result;
    } catch (error) {
      console.error(' [Notification.deleteAllByUser] Error:', error.message);
      throw error;
    }
  }
};
