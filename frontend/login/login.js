
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const data = { username, password };

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      // Save token to localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // If there is a pending booking saved (user started booking before login), go to booking page
      try {
        const pending = sessionStorage.getItem('pendingBooking');
        if (pending) {
          // Redirect to booking page where the pending data will be prefilled
          window.location.href = 'http://localhost:3000/Landing/booking.html';
          return;
        }
      } catch (err) {
        // ignore
      }

      // Default redirect after login
      window.location.href = 'http://localhost:3000/Landing/landing_page.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});


