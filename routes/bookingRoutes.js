// routes/bookingRoutes.js
import express from 'express';
import { createBooking, rescheduleBooking, cancelBooking, getQRCode, getBookingsByUser, checkInBooking } from '../controllers/bookingController.js';
import Booking from '../models/booking.js';
import QRCode from 'qrcode';

const router = express.Router();


// Create booking
router.post('/', createBooking);

// Development-only debug route to exercise Booking.create and return any SQL/error details
router.post('/debug', async (req, res) => {
	if (process.env.NODE_ENV !== 'development') {
		return res.status(404).json({ message: 'Not found' });
	}

	try {
		const nowIso = new Date().toISOString().split('T')[0];
		const qr = await QRCode.toDataURL(`debug:${Date.now()}`);
		const booking = await Booking.create({
			studentId: null,
			instructorId: null,
			lessonType: 'Debug',
			date: nowIso,
			startTime: null,
			endTime: null,
			notes: 'Debug entry',
			clientName: 'debug-user',
			hours: 1,
			qrCode: qr
		});

		res.json({ ok: true, booking_id: booking.insertId });
	} catch (err) {
		console.error('[booking debug] Error:', err);
		res.status(500).json({ ok: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
	}
});

// Check-in endpoint (specific, before :id routes)
router.post('/checkin', checkInBooking);

// Get bookings for user (specific, before :id routes)
router.get('/user/:userId', getBookingsByUser);

// Get QR code (specific pattern)
router.get('/:id/qrcode', getQRCode);

// Update booking
router.put('/:id', rescheduleBooking);

// Delete booking
router.delete('/:id', cancelBooking);

export default router;