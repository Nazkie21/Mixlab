
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;

  try {
    const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const result = await res.json();

    if (res.ok) {
      // Save email temporarily for OTP verification
      localStorage.setItem('resetEmail', email);
      
      alert(result.message);
      // Redirect to OTP verification page
      window.location.href = '/FrontEnd/Verify-OTP/verify-otp.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});


