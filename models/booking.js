// models/booking.js
import { connectToDatabase } from '../config/db.js';

const Booking = {
  // cached columns for bookings table
  _cachedColumns: null,

  _getColumns: async (db) => {
    if (Booking._cachedColumns) return Booking._cachedColumns;
    try {
      const [rows] = await db.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'`
      );
      Booking._cachedColumns = rows.map(r => r.COLUMN_NAME);
      return Booking._cachedColumns;
    } catch (err) {
      // If INFORMATION_SCHEMA is not accessible, fall back to common column names
      console.warn(' [booking._getColumns] Unable to query INFORMATION_SCHEMA, falling back to defaults:', err?.message);
      Booking._cachedColumns = ['booking_id','student_id','instructor_id','booking_date','date','notes','status','qr_code'];
      return Booking._cachedColumns;
    }
  },

  _getDateColumn: async (db) => {
    const cols = await Booking._getColumns(db);
    const candidates = ['booking_date', 'date', 'bookingDate', 'booking_date'];
    for (const c of candidates) {
      if (cols.includes(c)) return c;
    }
    const found = cols.find(c => c.toLowerCase().includes('date'));
    return found || 'booking_date';
  },

  _getIdColumn: async (db) => {
    const cols = await Booking._getColumns(db);
    const candidates = ['booking_id', 'id', 'bookingId'];
    for (const c of candidates) {
      if (cols.includes(c)) return c;
    }
    return cols[0] || 'booking_id';
  },

  _pickColumn: async (db, candidates) => {
    const cols = await Booking._getColumns(db);
    for (const c of candidates) {
      if (cols.includes(c)) return c;
    }
    return null;
  },

  _hasColumn: async (db, name) => {
    const cols = await Booking._getColumns(db);
    return cols.includes(name);
  },

  create: async ({ studentId, instructorId, lessonType, date, startTime, endTime, notes, qrCode, clientName, hours }) => {
    try {
      console.log(' [create] Creating booking:', { studentId, instructorId, lessonType, date });
      const db = await connectToDatabase();
      const dateCol = await Booking._getDateColumn(db);
      const hasClientName = await Booking._hasColumn(db, 'client_name');
      const hasName = await Booking._hasColumn(db, 'name');
      const hasNotes = await Booking._hasColumn(db, 'notes');
      const hasHours = await Booking._hasColumn(db, 'hours');
      const hasQr = await Booking._hasColumn(db, 'qr_code');

      // Build dynamic column list depending on schema; always include dateCol
      const columns = [];
      const placeholders = [];
      const params = [];

      if (await Booking._hasColumn(db, 'student_id')) {
        columns.push('`student_id`'); placeholders.push('?'); params.push(studentId || null);
      }
      if (await Booking._hasColumn(db, 'instructor_id')) {
        columns.push('`instructor_id`'); placeholders.push('?'); params.push(instructorId || null);
      }
      if (await Booking._hasColumn(db, 'lesson_type')) {
        columns.push('`lesson_type`'); placeholders.push('?'); params.push(lessonType || 'Recording Studio');
      }

      // date column (required)
      columns.push(`\`${dateCol}\``); placeholders.push('?'); params.push(date || null);

      if (await Booking._hasColumn(db, 'start_time')) {
        columns.push('`start_time`'); placeholders.push('?'); params.push(startTime || null);
      }
      if (await Booking._hasColumn(db, 'end_time')) {
        columns.push('`end_time`'); placeholders.push('?'); params.push(endTime || null);
      }

      if (await Booking._hasColumn(db, 'status')) {
        columns.push('`status`'); placeholders.push('?'); params.push('pending');
      }

      // Prefer explicit client_name or name column; otherwise use notes if present
      if (hasClientName) {
        columns.push('`client_name`'); placeholders.push('?'); params.push(clientName || null);
      } else if (hasName) {
        columns.push('`name`'); placeholders.push('?'); params.push(clientName || null);
      } else if (hasNotes) {
        columns.push('`notes`'); placeholders.push('?'); params.push(notes || null);
      }

      if (hasHours) {
        columns.push('`hours`'); placeholders.push('?'); params.push(hours || null);
      }

      if (hasQr) {
        columns.push('`qr_code`'); placeholders.push('?'); params.push(qrCode || null);
      }

      // Ensure we have at least one column to insert (besides created_at)
      if (columns.length === 0) {
        throw new Error('No writable columns found for bookings table');
      }

      const sql = `INSERT INTO bookings (${columns.join(', ')}, \`created_at\`) VALUES (${placeholders.join(', ')}, NOW())`;
      const [result] = await db.execute(sql, params);
      console.log(' [create] Booking created with ID:', result.insertId);
      return result;
    } catch (error) {
      console.error(' [create] Error:', error.message);
      throw error;
    }
  },

  update: async (id, { date, startTime, endTime, status }) => {
    try {
      console.log(' [update] Updating booking:', id);
      const db = await connectToDatabase();
      const dateCol = await Booking._getDateColumn(db);

      let query = 'UPDATE bookings SET ';
      const params = [];

      if (date) {
        query += `\`${dateCol}\` = ?, `;
        params.push(date);
      }
      if (startTime) {
        query += '`start_time` = ?, ';
        params.push(startTime);
      }
      if (endTime) {
        query += '`end_time` = ?, ';
        params.push(endTime);
      }
      if (status) {
        query += '`status` = ?, ';
        params.push(status);
      }

  const idCol = await Booking._getIdColumn(db);
  query += '`updated_at` = NOW() WHERE `' + idCol + '` = ?';
      params.push(id);

  const [result] = await db.execute(query, params);
      console.log(' [update] Updated');
      return result;
    } catch (error) {
      console.error(' [update] Error:', error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log(' [delete] Deleting booking:', id);
      const db = await connectToDatabase();
  const idCol = await Booking._getIdColumn(db);
  const [result] = await db.execute(`DELETE FROM bookings WHERE \`${idCol}\`=?`, [id]);
      console.log(' [delete] Deleted');
      return result;
    } catch (error) {
      console.error(' [delete] Error:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      console.log(' [getById] Fetching booking:', id);
      const db = await connectToDatabase();
  const idCol = await Booking._getIdColumn(db);
  const [rows] = await db.execute(`SELECT * FROM bookings WHERE \`${idCol}\`=?`, [id]);
      console.log(' [getById] Found:', rows[0] ? 'yes' : 'no');
      return rows[0];
    } catch (error) {
      console.error(' [getById] Error:', error.message);
      throw error;
    }
  },

  getByUserId: async (userId) => {
    try {
      console.log(' [getByUserId] Fetching bookings for user:', userId);
      const db = await connectToDatabase();
      const dateCol = await Booking._getDateColumn(db);
      const [rows] = await db.execute(
        `SELECT * FROM bookings WHERE \`student_id\`=? OR \`instructor_id\`=? ORDER BY \`${dateCol}\` DESC`,
        [userId, userId]
      );
      console.log(' [getByUserId] Found:', rows.length, 'bookings');
      return rows;
    } catch (error) {
      console.error(' [getByUserId] Error:', error.message);
      throw error;
    }
  },

  checkConflict: async ({ userId, date, time }) => {
    try {
      console.log(' [checkConflict] Checking conflict for date:', date);
      const db = await connectToDatabase();
      const dateCol = await Booking._getDateColumn(db);

      if (!date) {
        console.warn(' [checkConflict] No date provided');
        return false;
      }

      const [rows] = await db.execute(
        `SELECT * FROM bookings WHERE \`${dateCol}\`=? AND \`status\` NOT IN ('cancelled', 'Cancelled')`,
        [date]
      );

      const hasConflict = rows.length > 0;
      console.log(' [checkConflict] Conflict found:', hasConflict);
      return hasConflict;
    } catch (error) {
      console.error(' [checkConflict] Error:', error.message);
      throw error;
    }
  },

  // Find exact duplicate booking by name stored in notes (used by minimal flow)
  findDuplicateByNameAndDate: async (name, date) => {
    try {
      const db = await connectToDatabase();
      const dateCol = await Booking._getDateColumn(db);
      const hasClientName = await Booking._hasColumn(db, 'client_name');

      if (hasClientName) {
        const [rows] = await db.execute(
          `SELECT * FROM bookings WHERE \`${dateCol}\`=? AND \`client_name\` = ? AND \`status\` NOT IN ('cancelled','Cancelled')`,
          [date, name]
        );
        return rows.length > 0 ? rows[0] : null;
      }

      // fallback: notes format: `Name:theName; Hours:2`
      const likePattern = `Name:${name}%`;
      const hasName = await Booking._hasColumn(db, 'name');
      const hasNotes = await Booking._hasColumn(db, 'notes');
      if (hasName) {
        const [rows] = await db.execute(
          `SELECT * FROM bookings WHERE \`${dateCol}\`=? AND \`name\` = ? AND \`status\` NOT IN ('cancelled','Cancelled')`,
          [date, name]
        );
        return rows.length > 0 ? rows[0] : null;
      }

      if (hasNotes) {
        const [rows] = await db.execute(
          `SELECT * FROM bookings WHERE \`${dateCol}\`=? AND \`notes\` LIKE ? AND \`status\` NOT IN ('cancelled','Cancelled')`,
          [date, likePattern]
        );
        return rows.length > 0 ? rows[0] : null;
      }

      // No column available to check name duplicates; allow booking
      return null;
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(' [findDuplicateByNameAndDate] Error:', error.message);
      throw error;
    }
  },
 
  getByQRCode: async (qrCode) => {
    try {
      console.log(' [getByQRCode] Fetching by QR:', qrCode);
      const db = await connectToDatabase();
      const [rows] = await db.execute(
        `SELECT * FROM bookings WHERE \`qr_code\`=? LIMIT 1`,
        [qrCode]
      );
      console.log(' [getByQRCode] Found:', rows[0] ? 'yes' : 'no');
      return rows[0];
    } catch (error) {
      console.error(' [getByQRCode] Error:', error.message);
      throw error;
    }
  },

  markCheckedIn: async (bookingId) => {
    try {
      console.log(' [markCheckedIn] Marking checked in:', bookingId);
      const db = await connectToDatabase();
      const idCol = await Booking._getIdColumn(db);
      const [result] = await db.execute(
        `UPDATE bookings SET \`status\`='confirmed', \`check_in_time\`=NOW() WHERE \`${idCol}\`=?`,
        [bookingId]
      );
      console.log(' [markCheckedIn] Marked');
      return result;
    } catch (error) {
      console.error(' [markCheckedIn] Error:', error.message);
      throw error;
    }
  }
};

export default Booking;