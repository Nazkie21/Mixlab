-- Migration: add client_name and hours columns to bookings
-- Run this once in your database (replace DATABASE_NAME if necessary)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hours INT DEFAULT NULL;

-- Optional: add unique constraint to prevent same client booking same date
-- Make sure to use the correct date column name (booking_date or date). Adjust as needed.
ALTER TABLE bookings
  ADD UNIQUE IF NOT EXISTS idx_client_date (client_name, booking_date);
