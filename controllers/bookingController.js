// controllers/bookingController.js
import Booking from '../models/booking.js';
import QRCode from 'qrcode';
import { Notification } from '../models/notification.js';
import { connectToDatabase } from '../config/db.js';

export const createBooking = async (req, res) => {
  try {
    /*
      Original booking implementation (kept for future reference).
      It accepted many fields and required a linked studentId (or user_id).

    // Accept both user_id and studentId for compatibility
    const { user_id, studentId, instructorId, booking_date, service_type = 'Recording Studio', lessonType, startTime, endTime, notes } = req.body;

    console.log('[createBooking] Received body:', req.body);

    const finalStudentId = studentId || user_id;
    const finalLessonType = lessonType || service_type;
    const finalBookingDate = booking_date;

    console.log(' [createBooking] Processing:', { finalStudentId, instructorId, finalLessonType, finalBookingDate });

    if (!finalStudentId) {
      return res.status(400).json({ 
        message: 'studentId (or user_id) is required',
        received: { studentId, user_id }
      });
    }
    if (!finalBookingDate) {
      return res.status(400).json({ message: 'booking_date is required' });
    }

    // Check conflict if same time slot already booked
    const conflict = await Booking.checkConflict({ userId: finalStudentId, date: finalBookingDate });
    if (conflict) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    // generate QR code
    const qrData = `booking:${finalStudentId}-${finalBookingDate}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // create booking
    const booking = await Booking.create({
      studentId: finalStudentId,
      instructorId: instructorId || null,
      lessonType: finalLessonType,
      date: finalBookingDate,
      startTime: startTime || null,
      endTime: endTime || null,
      notes: notes || null,
      qrCode: qrCode
    });

    console.log('[createBooking] Booking created');

    // notify student
    await Notification.create({
      userId: finalStudentId,
      title: ' Booking Created',
      message: `Your ${finalLessonType} booking on ${finalBookingDate} has been created.`,
      type: 'booking'
    });

    */

    // Minimal booking flow required for current UI: accept only name, date, hours
    const { name, date, hours } = req.body;

    console.log('[createBooking] Received body (minimal):', { name, date, hours });

    if (!name || !date || !hours) {
      return res.status(400).json({ message: 'name, date and hours are required' });
    }

    // Normalize and validate date: convert to YYYY-MM-DD to match DB DATE columns
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD or a parseable date.' });
    }
    const isoDate = parsed.toISOString().split('T')[0]; // YYYY-MM-DD

    // Validate hours
    const hoursNumber = Number(hours);
    if (!Number.isFinite(hoursNumber) || hoursNumber <= 0) {
      return res.status(400).json({ message: 'Invalid hours value' });
    }

    // For minimal flow, only block exact duplicate (same name + date).
    // Allow different users to book the same date.
    const existing = await Booking.findDuplicateByNameAndDate(name, isoDate);
    if (existing) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    // generate QR code (use name + date to build a simple identifier)
    const qrData = `booking:${name.replace(/\s+/g, '_')}-${isoDate}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // create booking with minimal required fields
    // prefer storing into dedicated columns (client_name, hours) if available
    const booking = await Booking.create({
      studentId: null,
      instructorId: null,
      lessonType: 'Session',
      date: isoDate,
      startTime: null,
      endTime: null,
      notes: `Name:${name}; Hours:${hoursNumber}`,
      clientName: name,
      hours: hoursNumber,
      qrCode: qrCode
    });

    console.log('[createBooking] Booking created (minimal)');

    res.status(201).json({ 
      message: 'Booking created', 
      booking_id: booking.insertId,
      qr_code: qrCode,
      status: 'pending'
    });
  } catch (error) {
    // Log full error in development to help debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(' [createBooking] Error (full):', error);
    } else {
      console.error(' [createBooking] Error:', error.message);
    }

    res.status(500).json({
      message: 'Error creating booking',
      error: process.env.NODE_ENV === 'development' ? error.stack || error.message : 'Internal Server Error'
    });
  }
};


export const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, booking_date, start_time, end_time } = req.body;

    // Accept both old and new parameter names
    const finalDate = date || booking_date;
    const finalStartTime = time || start_time;
    const finalEndTime = end_time;

    console.log(' [rescheduleBooking] Rescheduling booking:', id);

    // Get booking
    const booking = await Booking.getById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check for conflicts
    if (finalDate) {
      const conflict = await Booking.checkConflict({ userId: booking.student_id, date: finalDate });
      if (conflict) {
        const db = await connectToDatabase();
        const dateCol = await Booking._getDateColumn(db);
        const idCol = await Booking._getIdColumn(db);
        const [conflictRows] = await db.execute(
          `SELECT * FROM bookings WHERE \`${dateCol}\`=? AND \`${idCol}\` != ? AND \`status\` NOT IN ('cancelled', 'Cancelled')`,
          [finalDate, id]
        );
        if (conflictRows.length > 0) {
          return res.status(400).json({ message: 'Time slot already booked' });
        }
      }
    }

    await Booking.update(id, { 
      date: finalDate, 
      startTime: finalStartTime,
      endTime: finalEndTime
    });
    
    // After successfully rescheduling
    await Notification.create({
      userId: booking.student_id,
      title: 'Booking Rescheduled',
      message: `Your booking has been rescheduled to ${finalDate}`,
      type: 'booking'
    });

    res.json({ message: 'Booking rescheduled' });
  } catch (error) {
    console.error(' [rescheduleBooking] Error:', error.message);
    res.status(500).json({ message: 'Error rescheduling booking', error: error.message });
  }
};



export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(' [cancelBooking] Cancelling booking:', id);

    // Get booking details before deleting
    const booking = await Booking.getById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.delete(id);
    
    // After successfully canceling
    const bookingDate = booking.booking_date || booking.date;
    const bookingId = booking.booking_id || booking.id || booking.bookingId;
    await Notification.create({
      userId: booking.student_id,
      title: 'Booking Cancelled',
      message: `Your booking on ${bookingDate} has been canceled`,
      type: 'booking'
    });

    res.json({ message: 'Booking canceled' });
  } catch (error) {
    console.error(' [cancelBooking] Error:', error.message);
    res.status(500).json({ message: 'Error canceling booking' });
  }
};


export const getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[getBookingsByUser] Fetching bookings for user:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const bookings = await Booking.getByUserId(userId);
    
    res.json({ 
      message: 'Bookings retrieved successfully', 
      bookings,
      count: bookings.length 
    });
  } catch (error) {
    console.error('[getBookingsByUser] Error:', error.message);
    res.status(500).json({ 
      message: 'Error retrieving bookings', 
      error: error.message 
    });
  }
};

export const getQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[getQRCode] Getting QR code for booking:', id);

    const booking = await Booking.getById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    res.json({ 
      booking_id: id,
      qr_code: booking.qr_code 
    });
  } catch (error) {
    console.error('[getQRCode] Error:', error.message);
    res.status(500).json({ message: 'Error generating QR code' });
  }
};


export const checkInBooking = async (req, res) => {
  try {
    const { booking_id, qr_code } = req.body;

    console.log(' [checkInBooking] Checking in:', { booking_id, qr_code });

    let booking = null;
    if (booking_id) {
      booking = await Booking.getById(booking_id);
    } else if (qr_code) {
      booking = await Booking.getByQRCode(qr_code);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingId = booking.booking_id || booking.id || booking.bookingId;
    const bookingDate = booking.booking_date || booking.date;

    if (booking.status === 'confirmed' || booking.status === 'Checked In') {
      return res.json({ message: 'Already checked in', booking_id: bookingId });
    }

    await Booking.markCheckedIn(bookingId);

    await Notification.create({
      userId: booking.student_id,
      title: ' Check-in Successful',
      message: `Checked in for your ${booking.lesson_type || 'booking'} on ${bookingDate}`,
      type: 'booking'
    });

    res.json({ message: 'Check-in successful', booking_id: bookingId });
  } catch (error) {
    console.error(' [checkInBooking] Error:', error.message);
    res.status(500).json({ message: 'Error during check-in', error: error.message });
  }
};