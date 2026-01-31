// DOM Elements
const signupForm = document.getElementById('signupForm');
const signupBtn = document.getElementById('signupBtn');
const loadingState = document.getElementById('loadingState');
const statusMessage = document.getElementById('statusMessage');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const termsCheckbox = document.getElementById('terms');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const googleSignup = document.getElementById('googleSignup');
const githubSignup = document.getElementById('githubSignup');
const loginLink = document.getElementById('loginLink');

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

// Toggle password visibility
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

toggleConfirmPassword.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Password strength checker
passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strength = checkPasswordStrength(password);
    updatePasswordStrength(strength);
});

// Real-time password confirmation check
confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.setCustomValidity('Passwords do not match');
    } else {
        this.setCustomValidity('');
    }
});

// Form submission
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showStatus('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showStatus('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showStatus('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showStatus('Passwords do not match', 'error');
        return;
    }
    
    if (!termsCheckbox.checked) {
        showStatus('Please accept the terms and conditions', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Attempt signup
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('Account created successfully! Redirecting to login...', 'success');
            
            // Clear form
            signupForm.reset();
            updatePasswordStrength(0);
            
            // Redirect to login after delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            const errorData = await response.json();
            
            // Handle specific error messages
            if (errorData.detail === "Email already registered") {
                showStatus('This email is already registered. Try logging in or use a different email.', 'error');
            } else if (errorData.detail === "Invalid email format") {
                showStatus('Please enter a valid email address.', 'error');
            } else {
                showStatus(errorData.detail || 'Signup failed. Please try again.', 'error');
            }
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showStatus('Network error. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
});

// Social signup handlers
googleSignup.addEventListener('click', async function() {
    showStatus('Connecting to Google...', 'info');
    
    try {
        // Mock Google OAuth flow - in production, use real Google OAuth
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showStatus('Google login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showStatus('Google login failed. Please try regular signup.', 'error');
        }
    } catch (error) {
        console.error('Google signup error:', error);
        showStatus('Google login error. Please try regular signup.', 'error');
    }
});

githubSignup.addEventListener('click', function() {
    showStatus('GitHub signup coming soon!', 'info');
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

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 3); // Max strength is 3
}

// Update password strength UI
function updatePasswordStrength(strength) {
    strengthBar.className = 'password-strength-bar';
    
    switch (strength) {
        case 0:
        case 1:
            strengthBar.classList.add('strength-weak');
            strengthBar.style.width = '33%';
            strengthText.textContent = 'Weak password';
            strengthText.className = 'text-xs text-red-400 mt-1';
            break;
        case 2:
            strengthBar.classList.add('strength-medium');
            strengthBar.style.width = '66%';
            strengthText.textContent = 'Medium strength';
            strengthText.className = 'text-xs text-yellow-400 mt-1';
            break;
        case 3:
            strengthBar.classList.add('strength-strong');
            strengthBar.style.width = '100%';
            strengthText.textContent = 'Strong password';
            strengthText.className = 'text-xs text-green-400 mt-1';
            break;
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
        signupBtn.disabled = true;
        signupBtn.classList.add('hidden');
        loadingState.classList.remove('hidden');
    } else {
        signupBtn.disabled = false;
        signupBtn.classList.remove('hidden');
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
        nameInput.value = 'Test User';
        emailInput.value = 'test@example.com';
        passwordInput.value = 'test123456';
        confirmPasswordInput.value = 'test123456';
        termsCheckbox.checked = true;
        updatePasswordStrength(checkPasswordStrength(passwordInput.value));
        showStatus('Demo credentials filled!', 'info');
    }
});
