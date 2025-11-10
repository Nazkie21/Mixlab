import { connectToDatabase } from '../config/db.js';

export const XP = {
  getUserXp: async (userId) => {
    try {
      console.log(' [XP.getUserXp] Fetching XP for user:', userId);
      const db = await connectToDatabase();
      const [rows] = await db.query('SELECT id, xp, level FROM users WHERE id = ?', [userId]);
      console.log(' [XP.getUserXp] Result:', rows[0] || 'null');
      return rows[0] || null;
    } catch (err) {
      console.error(' [XP.getUserXp] Database error:', err);
      throw err;
    }
  },

  addXp: async (userId, amount, reason = null) => {
    try {
      console.log(' [XP.addXp] Adding', amount, 'XP to user:', userId);
      const db = await connectToDatabase();
      
      const [result] = await db.query(
        'UPDATE users SET xp = COALESCE(xp, 0) + ?, updated_at = NOW() WHERE id = ?',
        [amount, userId]
      );
      
      console.log(' [XP.addXp] Update result:', result);
      
      if (result.affectedRows === 0) {
        console.error(' [XP.addXp] User not found:', userId);
        throw new Error('User not found');
      }
      
      // Log XP transaction (optional - only if xp_logs table exists)
      try {
        await db.query(
          'INSERT INTO xp_logs (user_id, amount, reason, created_at) VALUES (?, ?, ?, NOW())',
          [userId, amount, reason]
        );
        console.log(' [XP.addXp] XP logged successfully');
      } catch (logError) {
        console.warn(' [XP.addXp] Could not log XP:', logError.message);
      }
      
      return { userId, xpAdded: amount, reason };
    } catch (err) {
      console.error(' [XP.addXp] Database error:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sql: err.sql
      });
      throw err;
    }
  },

  calculateLevel: (xp) => {
    return Math.floor(xp / 100) + 1;
  },
};