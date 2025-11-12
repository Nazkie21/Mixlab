document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const homeAddress = document.getElementById('home-address') ? document.getElementById('home-address').value : '';
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const contact_number = document.getElementById('contact_number').value;

  const data = { username, name, contact_number,email, password, confirmPassword, homeAddress };

  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      // Save token to localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Redirect to account created page
      window.location.href = '/frontend/Account-created/account-created.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error. Please try again.');
  }
});
