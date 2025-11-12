import express from 'express';
import { 
  // REGISTRATION FLOW
  sendRegistrationOTP,
  verifyRegistrationOTP,
  resendRegistrationOTP,

  // LOGIN FLOW
  login, 

  // PASSWORD RESET FLOW
  forgotPassword, 
  verifyOTP, 
  resetPassword,

  // LOGOUT
  logout
} from '../controllers/authController.js';

// Import your validation middleware
// Note: You may want to create new validation for the registration routes
import { 
  validateLogin, 
  validateEmail, 
  validateOTP, 
  validateResetPassword 
} from '../middleware/authValidation.js';


const router = express.Router();

// === NEW USER REGISTRATION ROUTES ===
// (The old '/register' route is removed)
router.post('/send-registration-otp', sendRegistrationOTP);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/resend-registration-otp', resendRegistrationOTP);


// === EXISTING USER LOGIN ROUTE ===
router.post('/login', validateLogin, login);


// === PASSWORD RESET ROUTES ===
router.post('/forgot-password', validateEmail, forgotPassword);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/reset-password', validateResetPassword, resetPassword);


// === LOGOUT ROUTE ===
router.post('/logout', logout);


export default router;