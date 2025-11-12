document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form values
  const username = document.getElementById('username').value.trim();
  const firstName = document.getElementById('first').value.trim();
  const lastName = document.getElementById('last').value.trim();
  const email = document.getElementById('email').value.trim();
  const homeAddress = document.getElementById('home-address') ? document.getElementById('home-address').value.trim() : '';
  const birthday = document.getElementById('birthday').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const contact_number = document.getElementById('contact_number').value;

  // Combine name
  const name = `${firstName} ${lastName}`;

  // Validate passwords
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    return;
  }

  try {
    // Step 1: Request OTP from backend
    const otpRes = await fetch('http://localhost:5000/api/auth/send-registration-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const otpResult = await otpRes.json();

    if (otpRes.ok) {
      // Step 2: Save registration data temporarily (for OTP verification page)
      sessionStorage.setItem(
        'registrationData',
        JSON.stringify({ username, name, contact_number, email, password, confirmPassword, homeAddress, birthday })
      );

      // Step 3: Redirect to OTP verification page
      window.location.href = '../verify-otp/verify-otp.html';
    } else {
      alert(otpResult.message || 'Failed to send OTP. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});

// Handle Google Sign In
document.getElementById('googleSignInBtn')?.addEventListener('click', function() {
  window.location.href = '/api/auth/google';
});

// Handle Facebook Sign In
document.querySelector('.social-btn.facebook')?.addEventListener('click', function() {
  window.location.href = '/api/auth/facebook';
});
