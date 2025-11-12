# Registration OTP Implementation Guide

## Overview
This implementation adds OTP (One-Time Password) verification to the registration process. When users submit the registration form, they receive an OTP via email and must verify it before completing registration.

## Flow
1. User fills registration form and clicks Submit
2. Frontend sends registration data to `/api/auth/send-registration-otp`
3. Backend generates 6-digit OTP and sends it via email
4. User is redirected to OTP verification page
5. User enters OTP received in email
6. Frontend verifies OTP with backend `/api/auth/verify-registration-otp`
7. On successful verification, registration is completed
8. User is logged in and redirected to profile page

## Files Modified/Created

### Frontend Files

#### 1. `frontend/Register/register.js`
- Updated to send registration data to OTP endpoint instead of direct register
- Stores registration data in sessionStorage
- Redirects to OTP verification page

#### 2. `frontend/verify-otp/verify-otp.html`
- Updated with new OTP verification UI
- Added email display
- Added resend OTP functionality
- Improved styling

#### 3. `frontend/verify-otp/verify-otp.css`
- Completely redesigned with MixLab theme
- Added animations and better UX
- Responsive design

#### 4. `frontend/verify-otp/verify-otp-registration.js` (NEW)
- Handles OTP verification for registration
- Retrieves stored registration data
- Calls verification endpoint
- Completes registration after OTP verification
- Implements resend OTP with timer

### Backend Files

#### 1. `controllers/authController.js`
Added three new functions:
- `sendRegistrationOTP`: Generates and sends OTP to email
- `verifyRegistrationOTP`: Verifies the OTP is valid and not expired
- `resendRegistrationOTP`: Resends OTP to email

#### 2. `routes/authRoutes.js`
Added three new routes:
- `POST /api/auth/send-registration-otp`
- `POST /api/auth/verify-registration-otp`
- `POST /api/auth/resend-registration-otp`

### Database Files

#### 1. `migrations/002_create_temp_otps_table.sql` (NEW)
Creates `temp_otps` table to store temporary OTP codes with expiration

## Setup Instructions

### Step 1: Run Database Migration
Execute the migration file to create the temp_otps table:
```sql
-- Run in your MySQL database
source migrations/002_create_temp_otps_table.sql;
```

Or manually execute:
```sql
CREATE TABLE IF NOT EXISTS temp_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp),
  INDEX idx_expires_at (expires_at)
);
```

### Step 2: Configure Email Settings
Update your `.env` file with email credentials:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note**: For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character password in `EMAIL_PASSWORD`

### Step 3: Update Backend Port (if needed)
The frontend is configured to use `http://localhost:5000` for API calls. Update if your backend runs on a different port.

### Step 4: Test the Flow
1. Start your backend server: `node server.js`
2. Navigate to the Register page
3. Fill in registration details
4. Submit the form
5. You should receive an OTP email
6. Enter the OTP on the verification page
7. After successful verification, registration completes and you're logged in

## Features

### OTP Generation & Verification
- 6-digit random OTP
- 10-minute expiration
- Invalid/expired OTP rejection

### Email Template
- Professional HTML email
- Clear OTP display
- Security messaging

### User Experience
- Clear error messages
- Auto-focus on OTP input
- Only numeric input allowed
- Resend OTP with cooldown timer
- Success/error message display
- Back to registration link

### Security
- OTP stored in database with expiration
- Automatic cleanup of expired OTPs
- Password strength validation maintained
- Email uniqueness checked

## API Endpoints

### 1. Send Registration OTP
```
POST /api/auth/send-registration-otp
Body: {
  email: "user@example.com",
  username: "username",
  password: "password123"
}
Response: { message: "OTP sent to your email" }
```

### 2. Verify Registration OTP
```
POST /api/auth/verify-registration-otp
Body: {
  email: "user@example.com",
  otp: "123456"
}
Response: { message: "OTP verified successfully" }
```

### 3. Resend Registration OTP
```
POST /api/auth/resend-registration-otp
Body: {
  email: "user@example.com"
}
Response: { message: "OTP resent to your email" }
```

## Troubleshooting

### OTP not being sent
- Check email credentials in `.env`
- Verify Gmail App Password is correct
- Check server logs for errors

### OTP verification failing
- Ensure OTP hasn't expired (10 minutes)
- Verify correct email was used
- Check that registration data is in sessionStorage

### Frontend not connecting to backend
- Verify backend is running on `localhost:5000`
- Check CORS settings in backend
- Verify API endpoints are correct

## Future Enhancements
- SMS OTP as alternative
- Redis for OTP storage (production)
- Rate limiting on OTP requests
- Email verification status in user model
- Admin panel for OTP debugging
