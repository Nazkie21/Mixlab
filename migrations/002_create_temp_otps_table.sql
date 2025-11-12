-- Migration: Create temp_otps table for registration OTP verification
-- This table stores temporary OTP codes for email verification during registration

CREATE TABLE IF NOT EXISTS temp_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp),
  INDEX idx_expires_at (expires_at)
);
