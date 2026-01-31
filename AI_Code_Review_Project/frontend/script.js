// DOM Elements
const codeInput = document.getElementById('codeInput');
const languageSelect = document.getElementById('language');
const reviewBtn = document.getElementById('reviewBtn');
const rewriteBtn = document.getElementById('rewriteBtn');
const clearBtn = document.getElementById('clearBtn');
const pasteBtn = document.getElementById('pasteBtn');
const copyReviewBtn = document.getElementById('copyReviewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const reviewOutput = document.getElementById('reviewOutput');
const reviewText = document.getElementById('reviewText');
const suggestionsList = document.getElementById('suggestionsList');
const emptyState = document.getElementById('emptyState');
const statusBar = document.getElementById('statusBar');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const closeStatus = document.getElementById('closeStatus');
const charCount = document.getElementById('charCount');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// State management
let currentReview = null;
let currentRewrite = null;
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Event Listeners
reviewBtn.addEventListener('click', reviewCode);
rewriteBtn.addEventListener('click', rewriteCode);
clearBtn.addEventListener('click', clearCode);
pasteBtn.addEventListener('click', pasteFromClipboard);
copyReviewBtn.addEventListener('click', copyReview);
downloadBtn.addEventListener('click', downloadReport);
shareBtn.addEventListener('click', shareReview);
closeStatus.addEventListener('click', hideStatus);
logoutBtn.addEventListener('click', logout);

// Auto-resize textarea and character count
codeInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    updateCharCount();
    
    // Clear previous results when code is edited
    clearResults();
});

// Clear previous results when code is edited
function clearResults() {
    // Hide review output and show empty state
    reviewOutput.classList.add('hidden');
    emptyState.classList.remove('hidden');
    
    // Clear current review and rewrite data
    currentReview = null;
    currentRewrite = null;
    
    // Reset title
    const outputTitle = document.querySelector('#outputSection h2');
    if (outputTitle) {
        outputTitle.innerHTML = '<i class="fas fa-clipboard-check mr-2 text-yellow-400"></i>AI Review Results';
    }
    
    // Clear suggestions list
    suggestionsList.innerHTML = '';
    
    // Reset copy button
    const copyBtn = document.getElementById('copyReviewBtn');
    if (copyBtn) {
        copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy Review';
        copyBtn.onclick = copyReviewText;
    }
}

// Update character count
function updateCharCount() {
    const count = codeInput.value.length;
    charCount.textContent = `${count} characters`;
    
    // Change color based on length
    if (count > 10000) {
        charCount.className = 'text-xs text-red-400';
    } else if (count > 5000) {
        charCount.className = 'text-xs text-yellow-400';
    } else {
        charCount.className = 'text-xs text-gray-400';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to review
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        reviewCode();
    }
    // Ctrl/Cmd + Shift + R to rewrite
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        rewriteCode();
    }
    // Ctrl/Cmd + Shift + C to clear
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearCode();
    }
});

async function rewriteCode() {
    const code = codeInput.value.trim();
    const language = languageSelect.value;
    
    // Validation
    if (!code) {
        showStatus('Please paste some code to rewrite', 'warning');
        codeInput.focus();
        return;
    }
    
    // Show loading state
    setLoadingState(true, 'rewriting');
    hideStatus();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/rewrite`, {
            method: 'POST',
            body: JSON.stringify({
                code: code,
                language: language
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display rewrite results
        displayRewriteResults(data);
        showStatus('Code rewrite completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}. Make sure the backend server is running on ${API_BASE_URL}`, 'error');
        setLoadingState(false);
    }
}

async function reviewCode() {
    const code = codeInput.value.trim();
    const language = languageSelect.value;
    
    // Validation
    if (!code) {
        showStatus('Please paste some code to review', 'warning');
        codeInput.focus();
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideStatus();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/review`, {
            method: 'POST',
            body: JSON.stringify({
                code: code,
                language: language
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display results
        displayReviewResults(data);
        showStatus('Code review completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}. Make sure the backend server is running on ${API_BASE_URL}`, 'error');
        setLoadingState(false);
    }
}

function displayRewriteResults(data) {
    // Store current rewrite
    currentRewrite = data;
    
    // Hide loading and empty state
    loadingIndicator.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    // Show review output
    reviewOutput.classList.remove('hidden');
    reviewOutput.classList.add('fade-in');
    
    // Update title for rewrite
    const outputTitle = document.querySelector('#outputSection h2');
    if (outputTitle) {
        outputTitle.innerHTML = '<i class="fas fa-magic mr-2 text-purple-400"></i>AI Rewrite Results';
    }
    
    // Display rewritten code with syntax highlighting effect
    const rewriteText = data.rewritten_code || data.rewrite || 'No rewrite available.';
    reviewText.textContent = rewriteText;
    reviewText.className = 'bg-gray-700 rounded-lg p-4 text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono text-sm';
    
    // Display improvements/suggestions
    suggestionsList.innerHTML = '';
    if (data.improvements && data.improvements.length > 0) {
        data.improvements.forEach((improvement, index) => {
            setTimeout(() => {
                const li = document.createElement('li');
                li.className = 'flex items-start bg-gray-700 rounded-lg p-3 fade-in hover-lift';
                li.innerHTML = `
                    <i class="fas fa-check-circle text-green-400 mt-1 mr-3 flex-shrink-0"></i>
                    <span class="text-gray-300">${improvement}</span>
                `;
                suggestionsList.appendChild(li);
            }, index * 200);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'bg-gray-700 rounded-lg p-3 text-gray-400 fade-in';
        li.innerHTML = '<i class="fas fa-info-circle mr-2"></i>Code has been optimized and improved.';
        suggestionsList.appendChild(li);
    }
    
    // Update action buttons for rewrite
    const copyBtn = document.getElementById('copyReviewBtn');
    if (copyBtn) {
        copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy Code';
        copyBtn.onclick = copyRewrittenCode;
    }
    
    setLoadingState(false);
}

// Copy rewritten code to clipboard
function copyRewrittenCode() {
    if (!currentRewrite) return;
    
    const rewriteText = currentRewrite.rewritten_code || currentRewrite.rewrite || '';
    
    navigator.clipboard.writeText(rewriteText).then(() => {
        showStatus('Rewritten code copied to clipboard!', 'success');
    }).catch(() => {
        showStatus('Failed to copy rewritten code', 'error');
    });
}

function displayReviewResults(data) {
    // Store current review
    currentReview = data;
    
    // Hide loading and empty state
    loadingIndicator.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    // Show review output
    reviewOutput.classList.remove('hidden');
    reviewOutput.classList.add('fade-in');
    
    // Reset title for review
    const outputSection = document.querySelector('#outputSection h2') || document.querySelector('section:nth-child(2) h2');
    if (outputSection) {
        outputSection.innerHTML = '<i class="fas fa-clipboard-check mr-2 text-yellow-400"></i>AI Review Results';
    }
    
    // Display review text with typing effect
    typeWriterEffect(data.review || 'No review available.', reviewText);
    reviewText.className = 'bg-gray-700 rounded-lg p-4 text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto';
    
    // Display suggestions with staggered animation
    suggestionsList.innerHTML = '';
    if (data.suggestions && data.suggestions.length > 0) {
        data.suggestions.forEach((suggestion, index) => {
            setTimeout(() => {
                const li = document.createElement('li');
                li.className = 'flex items-start bg-gray-700 rounded-lg p-3 fade-in hover-lift';
                li.innerHTML = `
                    <i class="fas fa-lightbulb text-yellow-400 mt-1 mr-3 flex-shrink-0"></i>
                    <span class="text-gray-300">${suggestion}</span>
                `;
                suggestionsList.appendChild(li);
            }, index * 200);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'bg-gray-700 rounded-lg p-3 text-gray-400 fade-in';
        li.innerHTML = '<i class="fas fa-info-circle mr-2"></i>No specific suggestions provided.';
        suggestionsList.appendChild(li);
    }
    
    // Reset action buttons for review
    const copyBtn = document.getElementById('copyReviewBtn');
    if (copyBtn) {
        copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy';
        copyBtn.onclick = copyReview;
    }
    
    setLoadingState(false);
    showStatus('Code review completed successfully!', 'success');
}

// Typewriter effect for review text
function typeWriterEffect(text, element, speed = 20) {
    element.textContent = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Paste from clipboard
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        codeInput.value = text;
        codeInput.style.height = 'auto';
        codeInput.style.height = codeInput.scrollHeight + 'px';
        updateCharCount();
        showStatus('Code pasted successfully!', 'success');
    } catch (err) {
        showStatus('Failed to paste from clipboard', 'error');
    }
}

// Copy review to clipboard
function copyReview() {
    if (!currentReview) return;
    
    const reviewText = `AI Code Review\n\n${currentReview.review}\n\nSuggestions:\n${currentReview.suggestions.join('\n')}`;
    
    navigator.clipboard.writeText(reviewText).then(() => {
        showStatus('Review copied to clipboard!', 'success');
    }).catch(() => {
        showStatus('Failed to copy review', 'error');
    });
}

// Download review as text file
function downloadReport() {
    if (!currentReview) return;
    
    const reviewText = `AI Code Review Report\n========================\nLanguage: ${languageSelect.value}\nDate: ${new Date().toLocaleString()}\n\nCode:\n${codeInput.value}\n\nReview:\n${currentReview.review}\n\nSuggestions:\n${currentReview.suggestions.join('\n')}`;
    
    const blob = new Blob([reviewText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-review-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showStatus('Report downloaded successfully!', 'success');
}

// Share review functionality
function shareReview() {
    if (!currentReview) return;
    
    const shareText = `Check out this AI code review:\n\n${currentReview.review.substring(0, 200)}...`;
    
    if (navigator.share) {
        navigator.share({
            title: 'AI Code Review',
            text: shareText,
            url: window.location.href
        }).then(() => {
            showStatus('Review shared successfully!', 'success');
        }).catch(() => {
            showStatus('Failed to share review', 'error');
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showStatus('Share text copied to clipboard!', 'success');
        });
    }
}

function clearCode() {
    codeInput.value = '';
    codeInput.style.height = 'auto';
    reviewOutput.classList.add('hidden');
    emptyState.classList.remove('hidden');
    currentReview = null;
    updateCharCount();
    hideStatus();
    codeInput.focus();
    showStatus('Code cleared', 'info');
}

function setLoadingState(isLoading, mode = 'review') {
    if (isLoading) {
        reviewBtn.disabled = true;
        rewriteBtn.disabled = true;
        
        if (mode === 'rewriting') {
            reviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rewriting...';
            rewriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rewriting...';
        } else {
            reviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Reviewing...';
            rewriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Reviewing...';
        }
        
        reviewBtn.classList.add('opacity-75', 'cursor-not-allowed');
        rewriteBtn.classList.add('opacity-75', 'cursor-not-allowed');
        loadingIndicator.classList.remove('hidden');
        reviewOutput.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        reviewBtn.disabled = false;
        rewriteBtn.disabled = false;
        reviewBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Review Code';
        rewriteBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Rewrite Code';
        reviewBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        rewriteBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        loadingIndicator.classList.add('hidden');
    }
}

function showStatus(message, type = 'info') {
    statusText.textContent = message;
    
    // Set icon and color based on type
    statusIcon.className = 'fas mr-2';
    statusBar.className = 'mt-6 rounded-lg p-4 fade-in';
    
    // Remove all glow classes
    statusBar.classList.remove('success-glow', 'error-glow', 'warning-glow');
    
    switch (type) {
        case 'success':
            statusIcon.classList.add('fa-check-circle', 'text-green-400');
            statusBar.classList.add('bg-green-900', 'border', 'border-green-700', 'success-glow');
            break;
        case 'error':
            statusIcon.classList.add('fa-exclamation-circle', 'text-red-400');
            statusBar.classList.add('bg-red-900', 'border', 'border-red-700', 'error-glow');
            break;
        case 'warning':
            statusIcon.classList.add('fa-exclamation-triangle', 'text-yellow-400');
            statusBar.classList.add('bg-yellow-900', 'border', 'border-yellow-700', 'warning-glow');
            break;
        default:
            statusIcon.classList.add('fa-info-circle', 'text-blue-400');
            statusBar.classList.add('bg-blue-900', 'border', 'border-blue-700');
    }
    
    statusBar.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success' || type === 'info') {
        setTimeout(hideStatus, 5000);
    }
}

function hideStatus() {
    statusBar.classList.add('hidden');
}

// Check backend connection on page load
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            showStatus('Connected to backend successfully!', 'success');
            setTimeout(hideStatus, 3000);
        }
    } catch (error) {
        showStatus('Backend server not found. Please start the backend server first.', 'warning');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    codeInput.focus();
    updateCharCount();
    
    // Add some sample code for demonstration (optional)
    const sampleCode = `// Welcome to AI Code Review Assistant!
// Paste your code here and click "Review Code"
// Try these keyboard shortcuts:
// Ctrl+Enter: Review Code
// Ctrl+Shift+C: Clear Code

function exampleFunction() {
    console.log("Hello, AI Code Review!");
    return "Ready to review your code";
}`;
    
    // Uncomment to load sample code on page load
    // codeInput.value = sampleCode;
    // updateCharCount();
    // codeInput.style.height = codeInput.scrollHeight + 'px';
});

// Check authentication status
async function checkAuthStatus() {
    if (!authToken) {
        // Redirect to login if no token
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            userEmail.textContent = user.email;
        } else {
            // Token invalid, redirect to login
            logout();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        logout();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    window.location.href = 'login.html';
}

// Update API calls to include authentication
async function makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

// Add sample code for testing (optional)
function loadSampleCode() {
    const sampleCodes = {
        python: `def calculate_factorial(n):
    if n <= 1:
        return 1
    else:
        return n * calculate_factorial(n - 1)

# Test the function
result = calculate_factorial(5)
print(f"Factorial of 5 is: {result}")`,
        
        javascript: `function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

// Example usage
const numbers = [1, 5, 3, 9, 2];
console.log(findMax(numbers));`,
        
        java: `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        int result = add(5, 3);
        System.out.println("Result: " + result);
    }
}`
    };
    
    const language = languageSelect.value;
    if (sampleCodes[language]) {
        codeInput.value = sampleCodes[language];
        codeInput.style.height = 'auto';
        codeInput.style.height = codeInput.scrollHeight + 'px';
    }
}

// Add sample code button (optional enhancement)
languageSelect.addEventListener('change', function() {
    clearResults();
    hideStatus();
    // You could add a "Load Sample Code" button here
});
