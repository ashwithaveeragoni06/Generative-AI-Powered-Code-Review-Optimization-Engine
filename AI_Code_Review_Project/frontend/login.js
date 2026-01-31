// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loadingState = document.getElementById('loadingState');
const statusMessage = document.getElementById('statusMessage');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const rememberCheckbox = document.getElementById('remember');
const googleLogin = document.getElementById('googleLogin');
const githubLogin = document.getElementById('githubLogin');
const signupLink = document.getElementById('signupLink');

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
});

// Toggle password visibility
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!email || !password) {
        showStatus('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showStatus('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Attempt login
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save authentication token
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Remember email if checked
            if (rememberCheckbox.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            showStatus('Login successful! Redirecting...', 'success');
            
            // Redirect to main app after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            showStatus(data.message || 'Login failed. Please check your credentials.', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showStatus('Network error. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
});

// Social login handlers
googleLogin.addEventListener('click', async function() {
    showStatus('Connecting to Google...', 'info');
    
    try {
        // Mock Google OAuth flow - in production, use real Google OAuth
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Google login response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Google login success:', data);
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showStatus('Google login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            const errorData = await response.json();
            console.log('Google login error:', errorData);
            showStatus(errorData.detail || 'Google login failed. Please try regular login.', 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showStatus('Network error. Please check your connection.', 'error');
    }
});

githubLogin.addEventListener('click', function() {
    showStatus('GitHub login coming soon!', 'info');
});

// Signup link handler
signupLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'signup.html';
});

// Check authentication status
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // User is already authenticated, redirect to main app
                window.location.href = 'index.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Loading state management
function setLoadingState(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.classList.add('hidden');
        loadingState.classList.remove('hidden');
    } else {
        loginBtn.disabled = false;
        loginBtn.classList.remove('hidden');
        loadingState.classList.add('hidden');
    }
}

// Status message display
function showStatus(message, type = 'info') {
    statusText.textContent = message;
    
    // Set icon and color based on type
    statusIcon.className = 'fas mr-2';
    const statusDiv = statusMessage.querySelector('div');
    
    // Remove all background classes
    statusDiv.className = 'glass-effect rounded-lg p-4 text-center';
    
    switch (type) {
        case 'success':
            statusIcon.classList.add('fa-check-circle', 'text-green-400');
            statusDiv.classList.add('bg-green-500/20', 'border', 'border-green-400/30');
            break;
        case 'error':
            statusIcon.classList.add('fa-exclamation-circle', 'text-red-400');
            statusDiv.classList.add('bg-red-500/20', 'border', 'border-red-400/30');
            break;
        case 'warning':
            statusIcon.classList.add('fa-exclamation-triangle', 'text-yellow-400');
            statusDiv.classList.add('bg-yellow-500/20', 'border', 'border-yellow-400/30');
            break;
        default:
            statusIcon.classList.add('fa-info-circle', 'text-blue-400');
            statusDiv.classList.add('bg-blue-500/20', 'border', 'border-blue-400/30');
    }
    
    statusMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
}

// Demo credentials for testing
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+D to fill demo credentials
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        emailInput.value = 'demo@example.com';
        passwordInput.value = 'demo123';
        showStatus('Demo credentials filled!', 'info');
    }
});
