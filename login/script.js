const API_URL = 'http://localhost:3000/api';

// Switch between login and register tabs
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
        loadUsers(); // Load users when switching to register tab
    }
}

// Show message
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type} show`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('loginMessage', `Welcome back, ${data.user.username}!`, 'success');
            // Store user data in localStorage or sessionStorage if needed
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Clear form
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            showMessage('loginMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Failed to connect to server', 'error');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('registerMessage', 'Registration successful! You can now login.', 'success');
            
            // Clear form
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            
            // Reload users list
            loadUsers();
        } else {
            showMessage('registerMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Failed to connect to server', 'error');
    }
}

// Load and display registered users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/registered-users`);
        const data = await response.json();
        
        if (data.success && data.users.length > 0) {
            const usersListEl = document.getElementById('usersList');
            usersListEl.innerHTML = `
                <h3>Registered Users (${data.users.length})</h3>
                <ul>
                    ${data.users.map(user => `
                        <li>${user.username} (${user.email})</li>
                    `).join('')}
                </ul>
            `;
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Check if user is logged in on page load
window.onload = function() {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        showMessage('loginMessage', `Already logged in as ${userData.username}`, 'success');
    }
};
