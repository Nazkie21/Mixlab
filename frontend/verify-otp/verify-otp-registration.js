document.addEventListener('DOMContentLoaded', function() {
  const otpForm = document.getElementById('otpForm');
  const otpInput = document.getElementById('otp');
  const resendBtn = document.getElementById('resendBtn');
  const resendTimer = document.getElementById('resendTimer');
  const emailDisplay = document.getElementById('emailDisplay');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Get registration data from session storage
  const registrationData = sessionStorage.getItem('registrationData');
  if (!registrationData) {
    window.location.href = '../Register/register.html';
    return;
  }

  const { email, username, password } = JSON.parse(registrationData);
  emailDisplay.textContent = `Code sent to ${email}`;

  // Handle OTP verification
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = otpInput.value.trim();

    if (otp.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp
        })
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Email verified! Completing registration...');
        
        // Now complete the registration
        const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password
          })
        });

        const registerResult = await registerResponse.json();

        if (registerResponse.ok) {
          // Save user data
          localStorage.setItem('token', registerResult.token);
          localStorage.setItem('user', JSON.stringify(registerResult.user));
          
          // Clear session data
          sessionStorage.removeItem('registrationData');
          
          // Redirect to profile or account created page
          setTimeout(() => {
            window.location.href = '../Account-created/profile.html';
          }, 1500);
        } else {
          showError(registerResult.message || 'Registration failed');
        }
      } else {
        showError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network error. Please try again.');
    }
  });

  // Handle resend OTP
  resendBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('OTP resent to your email');
        startResendTimer();
      } else {
        showError(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network error. Please try again.');
    }
  });

  // Resend timer function
  function startResendTimer() {
    resendBtn.disabled = true;
    let seconds = 60;
    resendTimer.textContent = `Resend in ${seconds}s`;
    resendTimer.style.display = 'block';

    const interval = setInterval(() => {
      seconds--;
      resendTimer.textContent = `Resend in ${seconds}s`;

      if (seconds <= 0) {
        clearInterval(interval);
        resendBtn.disabled = false;
        resendTimer.style.display = 'none';
      }
    }, 1000);
  }

  // Auto-focus next input on numeric entry
  otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }
});
