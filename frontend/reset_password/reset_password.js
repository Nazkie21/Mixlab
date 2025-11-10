document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const resetToken = localStorage.getItem('resetToken');
  const email = localStorage.getItem('resetEmail');

  if (!resetToken || !email) {
    alert('Session expired. Please start over.');
    window.location.href = '/FrontEnd/Forgot_password/forgot_password.html';
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetToken, newPassword })
    });

    const result = await res.json();

    if (res.ok) {
      // Clear temporary data
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('resetToken');
      
      alert(result.message);
      // Redirect to login page
      window.location.href = '/FrontEnd/Login/login.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});



