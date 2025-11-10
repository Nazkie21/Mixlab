import bcrypt from 'bcrypt';
import { connectToDatabase  } from '../config/db.js';

const saltRounds = 10; //rainbow table, same password

const User = {
  create: async ({ name, email, password, role = 'user' }) => { ///db is student
    const hashed = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );
    return { id: result.insertId, name, email, role };
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  updatePassword: async (id, newPassword) => {
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
  },

  setResetToken: async (id, token, expiry) => {
    await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [token, expiry, id]);
  }
};

export default User;