
document.getElementById('otpForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const otp = document.getElementById('otp').value;
  const email = localStorage.getItem('resetEmail');

  if (!email) {
    alert('Session expired. Please start over.');
    window.location.href = '/FrontEnd/Forgot_password/forgot_password.html';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    const result = await res.json();

    if (res.ok) {
      // Save reset token
      localStorage.setItem('resetToken', result.resetToken);
      
      // Redirect to reset password page
      window.location.href = '/FrontEnd/Reset-Password/reset_password.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});
