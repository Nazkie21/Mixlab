document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

<<<<<<< HEAD
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
=======
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const homeAddress = document.getElementById('home-address') ? document.getElementById('home-address').value : '';
>>>>>>> 347fa79c04c9256779b198566e05039ac531a9e8
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const contact_number = document.getElementById('contact_number').value;

<<<<<<< HEAD
  // Validate passwords match
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // Validate password strength
  if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    return;
  }
=======
  const data = { username, name, contact_number,email, password, confirmPassword, homeAddress };
>>>>>>> 347fa79c04c9256779b198566e05039ac531a9e8

  try {
    // Send registration request to generate OTP
    const res = await fetch('http://localhost:5000/api/auth/send-registration-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password
      })
    });

    const result = await res.json();

    if (res.ok) {
      // Store registration data in session storage
      sessionStorage.setItem('registrationData', JSON.stringify({
        username,
        email,
        password
      }));
      
      // Redirect to OTP verification page
      window.location.href = '../verify-otp/verify-otp.html';
    } else {
      alert(result.message || 'Registration failed. Please try again.');
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

