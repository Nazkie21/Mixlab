const validateRegister = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({ message: 'Username is required' });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ message: 'Username must be between 3 and 50 characters' });
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({ message: 'Email is required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ message: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  next();
};

const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  if (otp.length !== 6) {
    return res.status(400).json({ message: 'OTP must be 6 digits' });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  next();
};

export { 
  validateRegister, 
  validateLogin, 
  validateEmail, 
  validateOTP, 
  validateResetPassword 
};
