import { connectToDatabase } from '../config/db.js';

export const getUserXp = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT id, xp, level FROM users WHERE id = ?', [id]);
    
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    
    res.json(rows[0]);
  } catch (error) {
    console.error(' Error fetching XP:', error);
    res.status(500).json({ message: 'Error fetching XP' });
  }
};

export const addUserXp = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 0, reason = null } = req.body;
    
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });
    
    const db = await connectToDatabase();
    
    // Update user XP
    const [result] = await db.query(
      'UPDATE users SET xp = COALESCE(xp, 0) + ?, updated_at = NOW() WHERE id = ?',
      [amount, id]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    
    // Log XP transaction (optional - only if xp_logs table exists)
    try {
      await db.query(
        'INSERT INTO xp_logs (user_id, amount, reason, created_at) VALUES (?, ?, ?, NOW())',
        [id, amount, reason]
      );
    } catch (logError) {
      console.warn(' XP log table may not exist, skipping log');
    }
    
    // Get updated user info
    const [updatedUser] = await db.query('SELECT id, xp, level FROM users WHERE id = ?', [id]);
    
    res.json({ 
      message: 'XP added successfully', 
      userId: id, 
      xpAdded: amount, 
      reason,
      user: updatedUser[0]
    });
  } catch (error) {
    console.error(' Error adding XP:', error);
    res.status(500).json({ message: error.message || 'Error adding XP' });
  }
};