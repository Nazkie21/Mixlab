document.addEventListener('DOMContentLoaded', function() {
  // --- Your Original Helper Functions (they are perfect) ---
  const otpForm = document.getElementById('otpForm');
  const otpInput = document.getElementById('otp');
  const resendBtn = document.getElementById('resendBtn');
  const resendTimer = document.getElementById('resendTimer');
  const emailDisplay = document.getElementById('emailDisplay');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

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
  // --- End of Helper Functions ---


  // --- 1. Get Data from Session Storage ---
  const registrationDataString = sessionStorage.getItem('registrationData');
  if (!registrationDataString) {
    showError('Your session has expired. Please go back to the register page.');
    otpForm.querySelector('button[type="submit"]').disabled = true;
    return; // Stop if no data
  }
  
  const { email, username, password } = JSON.parse(registrationDataString);
  emailDisplay.textContent = `Code sent to ${email}`;

  // --- 2. Handle the OTP Form Submission ---
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page refresh

    const otp = otpInput.value.trim();

    if (otp.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    const requestBody = {
      username,
      email,
      password,
      otp
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        // SUCCESS!
        showSuccess('Email verified! Completing registration...');
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        sessionStorage.removeItem('registrationData');
        
        // This will now redirect you to the account created page
        setTimeout(() => {
          window.location.href = '../Account-created/account-created.html';
        }, 1500);
      } else {
        // FAILURE (e.g., "Invalid OTP")
        showError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network error. Please try again.');
V }
  });

  // --- 3. Handle Resend (Your code is fine) ---
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
});