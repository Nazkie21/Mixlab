import { connectToDatabase } from '../config/db.js';

export const getModules = async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM modules ORDER BY sort_order ASC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching modules' });
  }
};

export const getUserModules = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectToDatabase();
    const [rows] = await db.query(
      'SELECT m.* FROM user_modules um JOIN modules m ON um.module_id=m.module_id WHERE um.user_id=? ORDER BY m.sort_order ASC',
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching user modules' });
  }
};

export const unlockModule = async (req, res) => {
  try {
    const { userId, moduleId, reason = null } = req.body;
    const db = await connectToDatabase();
    await db.query('INSERT IGNORE INTO user_modules (user_id, module_id) VALUES (?, ?)', [userId, moduleId]);
    res.json({ message: 'Module unlocked', userId, moduleId, reason });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error unlocking module' });
  }
};


