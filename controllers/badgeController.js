// ============================================
// CONTROLLERS/badgeController.js - FIXED
// ============================================
import { connectToDatabase } from '../config/db.js';

export const getAllBadges = async (_req, res) => {
  try {
    console.log(' [getAllBadges] Fetching all badges');
    const db = await connectToDatabase();
    const [badges] = await db.query('SELECT * FROM badges ORDER BY badge_id ASC');
    console.log(' [getAllBadges] Found', badges.length, 'badges');
    res.json(badges || []);
  } catch (error) {
    console.error(' [getAllBadges] Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error fetching badges', 
      error: error.message 
    });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(' [getUserBadges] Fetching badges for user:', id);
    const db = await connectToDatabase();
    const [badges] = await db.query(
      'SELECT b.* FROM badges b JOIN user_badges ub ON b.badge_id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.earned_at DESC',
      [id]
    );
    console.log(' [getUserBadges] Found', badges.length, 'badges');
    res.json(badges || []);
  } catch (error) {
    console.error(' [getUserBadges] Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error fetching user badges', 
      error: error.message 
    });
  }
};

export const earnBadge = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    console.log(' [earnBadge] User:', userId, 'Badge:', badgeId);
    
    if (!userId || !badgeId) {
      return res.status(400).json({ message: 'userId and badgeId are required' });
    }
    
    const db = await connectToDatabase();
    
    // Check if already earned
    const [existing] = await db.query(
      'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badgeId]
    );
    
    if (existing && existing[0]) {
      console.warn(' [earnBadge] Badge already earned');
      return res.json({ message: 'Badge already earned' });
    }
    
    const [result] = await db.query(
      'INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, NOW())',
      [userId, badgeId]
    );
    
    console.log(' [earnBadge] Badge earned successfully');
    res.json({ userId, badgeId, earned_at: new Date() });
  } catch (error) {
    console.error(' [earnBadge] Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error earning badge', 
      error: error.message 
    });
  }
};

export const createBadge = async (req, res) => {
  try {
    const { name, description, iconUrl, xpRequirement } = req.body;
    console.log(' [createBadge] Creating badge:', name);
    
    if (!name) {
      return res.status(400).json({ message: 'Badge name is required' });
    }
    
    const db = await connectToDatabase();
    console.log(' [createBadge] DB connected, executing insert...');
    
    const [result] = await db.query(
      'INSERT INTO badges (name, description, icon_url, xp_requirement, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, description || null, iconUrl || null, xpRequirement || 0]
    );
    
    console.log('[createBadge] Badge created with ID:', result.insertId);
    res.status(201).json({ 
      badge_id: result.insertId, 
      name, 
      description: description || null, 
      icon_url: iconUrl || null,
      xp_requirement: xpRequirement || 0,
      created_at: new Date()
    });
  } catch (error) {
    console.error(' [createBadge] DETAILED ERROR:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error creating badge', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};