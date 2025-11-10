document.addEventListener('DOMContentLoaded', function() {
    const loginDropdown = document.getElementById('loginDropdown');
    const accountLink = document.getElementById('accountLink');
    const loginForm = document.getElementById('loginForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    // Check if user is logged in
    const userJson = localStorage.getItem('user');
    const isLoggedIn = !!userJson;

    // Function to toggle the login dropdown (only for non-logged in users)
    function handleAccountClick(e) {
        if (!isLoggedIn) {
            e.preventDefault();
            if (loginDropdown.style.display === 'block') {
                loginDropdown.style.display = 'none';
            } else {
                loginDropdown.style.display = 'block';
            }
        }
    }

    // Add click handler only if not logged in
    if (!isLoggedIn) {
        accountLink.addEventListener('click', handleAccountClick);
    }

    // If logged in, update the account link and avatar
    if (isLoggedIn) {
        try {
            const user = JSON.parse(userJson);
            
            // Create account container if it doesn't exist
            let accountContainer = accountLink.parentElement;
            if (!accountContainer.classList.contains('account-with-avatar')) {
                // Recreate the container with avatar
                accountContainer = document.createElement('div');
                accountContainer.className = 'account-with-avatar';
                accountLink.parentElement.insertBefore(accountContainer, accountLink);
                accountContainer.appendChild(accountLink);
                
                // Create avatar
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                // Use first letter of username/email as fallback
                const firstLetter = (user.username || user.name || user.email || 'U')[0].toUpperCase();
                avatar.innerHTML = `
                    <div class="avatar-circle">
                        <span class="avatar-initial">${firstLetter}</span>
                    </div>
                `;
                accountContainer.insertBefore(avatar, accountLink);
            }

            accountLink.textContent = user.username || user.name || user.email;
            accountLink.setAttribute('href', '../Account-created/profile.html');
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    }

    // Handle Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            window.location.href = '/api/auth/google';
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.account-container')) {
            loginDropdown.style.display = 'none';
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const errorMessageElement = document.getElementById('errorMessage') || 
            (() => {
                const div = document.createElement('div');
                div.id = 'errorMessage';
                div.style.color = 'red';
                div.style.marginTop = '10px';
                loginForm.appendChild(div);
                return div;
            })();
        
        // Clear any previous error messages
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';

        try {
            const isEmail = username.includes('@');
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    [isEmail ? 'email' : 'username']: username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI to show logged in state
                if (data.user) {
                    // Store the user data first
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Update account link
                    accountLink.textContent = data.user.username || data.user.name || data.user.email;
                    accountLink.setAttribute('href', '../Account-created/profile.html');
                    accountLink.classList.add('logged-in');
                    
                    // Close the login dropdown
                    loginDropdown.style.display = 'none';
                    
                    // Refresh the page to show the updated UI with logout button
                    window.location.reload();
                }
            } else {
                // Show error message in the form
                errorMessageElement.textContent = data.message || 'Invalid username or password';
                errorMessageElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            // Only show connection error if the login hasn't succeeded
            if (!localStorage.getItem('token') || !localStorage.getItem('user')) {
                errorMessageElement.textContent = 'Unable to connect to server. Please try again.';
                errorMessageElement.style.display = 'block';
            }
        }
    });
});