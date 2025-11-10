import { Notification } from '../models/notification.js';

// Send a custom notification
// POST /api/notifications
export const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'system' } = req.body;
    
    console.log(' [sendNotification] Received:', { userId, title, message, type });
    
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        message: 'userId, title, and message are required' 
      });
    }

    const notification = await Notification.create({ userId, title, message, type });
    res.status(201).json({ 
      message: 'Notification sent',
      notification 
    });
  } catch (error) {
    console.error(' [sendNotification] Error:', error.message);
    res.status(500).json({ 
      message: 'Error sending notification', 
      error: error.message 
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log(' [getNotifications] Fetching for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const notifications = await Notification.getAllByUser(userId);
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({ 
      notifications,
      unread_count: unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error(' [getNotifications] Error:', error.message);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
};

// Mark specific notification as read
// PUT /api/notifications/:notification_id/mark-read
export const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    
    console.log(' [markAsRead] Marking notification:', notification_id);
    
    if (!notification_id) {
      return res.status(400).json({ message: 'notification_id is required' });
    }

    await Notification.markAsRead(notification_id);
    
    res.json({ 
      message: 'Notification marked as read',
      notification_id
    });
  } catch (error) {
    console.error('[markAsRead] Error:', error.message);
    res.status(500).json({ 
      message: 'Error marking notification as read', 
      error: error.message 
    });
  }
};

// Mark all notifications as read
// PUT /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log('[markAllAsRead] Marking all for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const result = await Notification.markAllAsRead(userId);
    
    res.json({ 
      message: 'All notifications marked as read',
      marked: result.affectedRows
    });
  } catch (error) {
    console.error('[markAllAsRead] Error:', error.message);
    res.status(500).json({ 
      message: 'Error marking notifications as read', 
      error: error.message 
    });
  }
};

// Delete a specific notification
// DELETE /api/notifications/:notification_id
export const deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;
    
    console.log(' [deleteNotification] Deleting:', notification_id);
    
    if (!notification_id) {
      return res.status(400).json({ message: 'notification_id is required' });
    }

    await Notification.deleteNotification(notification_id);
    
    res.json({ 
      message: 'Notification deleted successfully',
      notification_id
    });
  } catch (error) {
    console.error('[deleteNotification] Error:', error.message);
    res.status(500).json({ 
      message: 'Error deleting notification', 
      error: error.message 
    });
  }
};

// Delete all notifications for user
// DELETE /api/notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log(' [deleteAllNotifications] Deleting all for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const result = await Notification.deleteAllByUser(userId);
    
    res.json({ 
      message: 'All notifications deleted',
      deleted: result.affectedRows
    });
  } catch (error) {
    console.error(' [deleteAllNotifications] Error:', error.message);
    res.status(500).json({ 
      message: 'Error deleting notifications', 
      error: error.message 
    });
  }
};

// HELPER: Send booking notification
export const notifyBookingAction = async (studentId, instructorId, action, bookingDetails) => {
  try {
    const { lesson_type, booking_date, start_time } = bookingDetails;
    let studentTitle = '';
    let studentMessage = '';
    let instructorTitle = '';
    let instructorMessage = '';

    switch (action) {
      case 'created':
        studentTitle = 'Booking Confirmed';
        studentMessage = `Your ${lesson_type} lesson has been booked for ${booking_date} at ${start_time}`;
        instructorTitle = ' New Booking';
        instructorMessage = `New ${lesson_type} lesson booking for ${booking_date} at ${start_time}`;
        break;
      case 'rescheduled':
        studentTitle = 'Booking Rescheduled';
        studentMessage = `Your lesson has been rescheduled to ${booking_date} at ${start_time}`;
        instructorTitle = 'Booking Rescheduled';
        instructorMessage = `Lesson rescheduled to ${booking_date} at ${start_time}`;
        break;
      case 'cancelled':
        studentTitle = 'Booking Cancelled';
        studentMessage = `Your ${lesson_type} lesson on ${booking_date} has been cancelled`;
        instructorTitle = 'Booking Cancelled';
        instructorMessage = `${lesson_type} lesson on ${booking_date} has been cancelled`;
        break;
      case 'reminder':
        studentTitle = 'Lesson Reminder';
        studentMessage = `Your ${lesson_type} lesson is coming up at ${start_time}`;
        instructorTitle = 'Lesson Reminder';
        instructorMessage = `Reminder: ${lesson_type} lesson at ${start_time}`;
        break;
      default:
        return;
    }

    // Send to student
    await Notification.create({
      userId: studentId,
      title: studentTitle,
      message: studentMessage,
      type: 'booking'
    });

    // Send to instructor
    await Notification.create({
      userId: instructorId,
      title: instructorTitle,
      message: instructorMessage,
      type: 'booking'
    });

    console.log('Booking notifications sent for:', action);
  } catch (error) {
    console.error('Error sending booking notifications:', error.message);
  }
};
