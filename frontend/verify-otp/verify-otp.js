document.addEventListener('DOMContentLoaded', () => {
  console.log('verify-otp.js script loaded.');

  const otpForm = document.getElementById('otpForm');
  const errorEl = document.getElementById('error-message');
  const resendBtn = document.getElementById('resendBtn');
  const otpInput = document.getElementById('otp');

  // --- THIS IS THE DEBUGGING ---
  // 1. Get the data from the previous page
  const dataString = sessionStorage.getItem('registrationData');
  console.log('Data string from sessionStorage:', dataString);
  
  const registrationData = dataString ? JSON.parse(dataString) : null;
  console.log('Parsed registrationData object:', registrationData);
  // -------------------------------

  // 2. Check if data exists.
  if (!registrationData) {
    if (errorEl) errorEl.innerText = 'Your session expired. Please go back and register again.';
    if (otpForm) otpForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  // 3. Set the email in the "Code sent to..." box
  const emailDisplay = document.getElementById('email-display');
  if (emailDisplay) {
    emailDisplay.innerText = `Code sent to ${registrationData.email}`;
  }

  // 4. Handle the form submission
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = otpInput.value;

    // --- THIS IS THE DEBUGGING ---
    const requestBody = {
      username: registrationData.username,
      email: registrationData.email,
      password: registrationData.password,
      otp: otp
    };
    console.log('Sending this body to the server:', requestBody);
    // -------------------------------

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();

      if (res.ok) {
        console.log('SUCCESS! User created.');
        localStorage.setItem('token', data.token);
        sessionStorage.removeItem('registrationData');
        window.location.href = '/frontend/Account-created/account-created.html';
      } else {
        console.error('Server error:', data.message);
        if (errorEl) errorEl.innerText = data.message;
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      if (errorEl) errorEl.innerText = 'Network error. Please try again.';
    }
  });

  // 5. Handle "Resend OTP"
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      console.log('Resend OTP clicked.');
      try {
        const res = await fetch('http://localhost:5000/api/auth/resend-registration-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: registrationData.email })
        });
        const data = await res.json();
        alert(data.message);
      } catch (error) {
        alert('Failed to resend OTP.');
      }
    });
  }
});