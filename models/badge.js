import { connectToDatabase } from '../config/db.js';

export const Badge = {
  getAll: async () => {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM badges ORDER BY badge_id ASC');
    return rows || [];
  },

  getUserBadges: async (userId) => {
    const db = await connectToDatabase();
    const [rows] = await db.query(
      'SELECT b.* FROM badges b JOIN user_badges ub ON b.badge_id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.earned_at DESC',
      [userId]
    );
    return rows || [];
  },

  earnBadge: async (userId, badgeId) => {
    const db = await connectToDatabase();
    
    // Check if already earned
    const [existing] = await db.query(
      'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badgeId]
    );
    if (existing && existing[0]) return { message: 'Badge already earned' };
    
    const [result] = await db.query(
      'INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, NOW())',
      [userId, badgeId]
    );
    
    return { userId, badgeId, earned_at: new Date() };
  },

  createBadge: async ({ name, description, iconUrl, xpRequirement = 0 }) => {
    const db = await connectToDatabase();
    const [result] = await db.query(
      'INSERT INTO badges (name, description, icon_url, xp_requirement, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, description, iconUrl, xpRequirement]
    );
    return { badge_id: result.insertId, name, description, iconUrl, xpRequirement };
  },
};
