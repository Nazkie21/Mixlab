import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import { connectToDatabase } from '../config/db.js';
import crypto from 'crypto';
import { sendRegistrationOTPEmail, sendOTPEmail } from '../utils/emailService.js';

// ====================================================================
// Helper Functions
// ====================================================================

const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // At least 8 chars, 1 letter, 1 number
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return re.test(password);
};

// ====================================================================
// FLOW 1: NEW USER REGISTRATION
// (Step 1: Send OTP)
// ====================================================================

export const sendRegistrationOTP = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and include at least 1 letter and 1 number"
    });
  }

  try {
    const db = await connectToDatabase();
    
    // Check if user already exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in the database
    await db.query(
      'INSERT INTO temp_otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
      [email, otp, otpExpiry, otp, otpExpiry]
    );

    // Send OTP via email
    try {
      await sendRegistrationOTPEmail(email, otp);
    } catch (error) {
      console.error('Error sending registration OTP:', error.message);
      return res.status(500).json({ message: "Failed to send OTP. Please check email configuration." });
    }

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 1: NEW USER REGISTRATION
// (Step 2: Verify OTP & Create User)
// ====================================================================

export const verifyRegistrationOTP = async (req, res) => {
  // 1. GET ALL DATA FROM CLIENT
  const { username, email, password, otp, role } = req.body;

  if (!email || !otp || !username || !password) {
    return res.status(400).json({ message: "Username, email, password, and OTP are required" });
  }
  
  try {
    const db = await connectToDatabase();

    // 2. VERIFY THE OTP
    const [rows] = await db.query(
      'SELECT * FROM temp_otps WHERE email = ? AND otp = ?',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Check for expiration using safe JavaScript time
    const record = rows[0];
    const expiryTime = new Date(record.expires_at);

    if (new Date() > expiryTime) {
      await db.query('DELETE FROM temp_otps WHERE email = ?', [email]);
      return res.status(401).json({ message: "Expired OTP" });
    }

    // 3. OTP IS VALID! CREATE THE USER
    const hashPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashPassword, role || 'student']
    );

    // 4. CLEAN UP & LOG IN
    await db.query('DELETE FROM temp_otps WHERE email = ?', [email]);

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, role: role || 'student' },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    // 5. SEND SUCCESS RESPONSE
    res.status(201).json({ 
      message: "User created successfully!",
      token,
      user: {
        id: userId,
        username,
        email,
        role: role || 'student'
      }
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 1: NEW USER REGISTRATION
// (Step 2.5: Resend OTP)
// ====================================================================

export const resendRegistrationOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const db = await connectToDatabase();
    await db.query(
      'INSERT INTO temp_otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
      [email, otp, otpExpiry, otp, otpExpiry]
    );

    try {
      await sendRegistrationOTPEmail(email, otp);
    } catch (error) {
      console.error('Error resending registration OTP:', error.message);
      return res.status(500).json({ message: "Failed to resend OTP" });
    }

    res.status(200).json({ message: "OTP resent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ====================================================================
// FLOW 2: EXISTING USER LOGIN
// ====================================================================

export const login = async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Email or username and password are required" });
  }

  try {
    const db = await connectToDatabase();

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email || null, username || null]
    );

    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const userId = user.id ?? user.user_id;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    const displayName = user.username || user.name || "";
    res.json({
      message: "Login successful",
      token,
      user: {
        id: userId,
        name: displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 3: PASSWORD RESET
// (Step 1: Forgot Password)
// ====================================================================

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const db = await connectToDatabase();
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ message: "Email not found" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry

    await db.query(
      'INSERT INTO temp_otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
      [email, otp, expiresAt, otp, expiresAt]
    );

    try {
      await sendOTPEmail(email, otp); // Assumes sendOTPEmail is your password reset email util
      return res.json({ message: "OTP sent to your email" });
    } catch (mailErr) {
        console.error('Error sending password reset OTP:', mailErr.message);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 3: PASSWORD RESET
// (Step 2: Verify OTP)
// ====================================================================

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const db = await connectToDatabase();

    const [rows] = await db.query(
      'SELECT * FROM temp_otps WHERE email = ? AND otp = ?',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const record = rows[0];
    const expiryTime = new Date(record.expires_at);

    if (new Date() > expiryTime) {
      await db.query('DELETE FROM temp_otps WHERE email = ?', [email]);
      return res.status(401).json({ message: "Expired OTP" });
    }

    // --- SUCCESS ---
    await db.query('DELETE FROM temp_otps WHERE email = ?', [email]);

    // Create a short-lived "reset token"
    const resetToken = jwt.sign(
      { email: email, purpose: 'password-reset' },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '10m' } // User has 10 minutes to reset password
  );

    res.json({ message: "OTP verified", resetToken: resetToken });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 3: PASSWORD RESET
// (Step 3: Reset Password)
// ====================================================================

export const resetPassword = async (req, res) => {
  const { newPassword, resetToken } = req.body;

  if (!newPassword || !resetToken) {
    return res.status(400).json({ message: "Password and token are required" });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters long and include at least 1 letter and 1 number" 
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'SECRET_KEY');

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({ message: "Invalid token purpose" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const email = decoded.email;

  try {
    const db = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password reset successful" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
};

// ====================================================================
// FLOW 4: LOGOUT
// ====================================================================

export const logout = (req, res) => {
  try {
    if (res.clearCookie) {
      res.clearCookie('auth_token');
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};