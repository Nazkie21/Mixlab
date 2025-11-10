import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import { connectToDatabase } from '../config/db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// import User from '../models/User.js'


// Helper functions for validation 
const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const validatePassword = (password) => {
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return re.test(password);
};

// Register Controller
export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  // Basic field check
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters long and include at least 1 letter and 1 number" 
    });
  }

  try {
    const db = await connectToDatabase();
    // Check if user already exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password and insert user with role (default to 'student')
    const hashPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashPassword, role || 'student']
    );

    // Return created user info
    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role: role || 'student'
      }
    });   
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

//LOGIN CONTROLLER
export const login = async (req, res) => {
  // Accept either email or username from the frontend
  const { email, username, password } = req.body;

  // Require password and at least one of email/username
  if ((!email && !username) || !password) {
    return res.status(400).json({ message: "Email or username and password are required" });
  }

  try {
    const db = await connectToDatabase();

    // Query by email OR username (prefer exact match)
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email || null, username || null]
    );

    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const userId = user.id ?? user.user_id; // support both schemas
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


//password reset
const OTP_EXPIRY_MINUTES = 10;
let otpStore = {}; // { email: { code, expiresAt, verified?: boolean } }

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const db = await connectToDatabase();
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).json({ message: "Email not found" });

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
        otpStore[email] = { code: otp, expiresAt };

        // Send OTP via email (production) or return/log in development
        try {
            if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: "Gmail",
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });

                await transporter.sendMail({
                    from: `"MixLab Studio" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: "Your OTP Code",
                    text: `Your OTP code is : ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
                });
                return res.json({ message: "OTP sent to your email" });
            }

            // Development fallback: expose OTP for testing
            console.log(`[DEV] OTP for ${email}: ${otp}`);
            return res.json({ message: "OTP generated", otp });
        } catch (mailErr) {
            console.warn('Email send failed, returning OTP in response for testing:', mailErr?.message);
            return res.json({ message: "OTP generated ", otp });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// VERIFY OTP
export const verifyOTP = (req, res) => {
    const { email, otp } = req.body;

    if (!otpStore[email]) return res.status(400).json({ message: "No OTP sent for this email" });

    if (Date.now() > otpStore[email].expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ message: "OTP expired" });
    }

    if (otpStore[email].code !== otp) return res.status(400).json({ message: "Invalid OTP" });

    otpStore[email].verified = true;
    res.json({ message: "OTP verified" });
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!otpStore[email] || otpStore[email].verified !== true) {
        return res.status(400).json({ message: "OTP verification required" });
    }

    try {
        const db = await connectToDatabase();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

        // Clear OTP
        delete otpStore[email];

        res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// LOGOUT (stateless JWT: client should discard token; clear cookies if any)
export const logout = (req, res) => {
  try {
    // Clear potential auth cookies if used anywhere
    if (res.clearCookie) {
      res.clearCookie('auth_token');
      res.clearCookie('guest_id');
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};






//RBAC 
export const registerWithRole = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const db = await connectToDatabase();
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already used" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "user"]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginWithRole = async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await connectToDatabase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


