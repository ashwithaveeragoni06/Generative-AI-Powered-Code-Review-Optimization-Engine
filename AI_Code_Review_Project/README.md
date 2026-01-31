# AI Code Review Project

A full-stack web application that provides intelligent code reviews powered by AI using FastAPI backend and modern frontend.

## 🏗️ Project Structure

```
AI_Code_Review_Project/
│── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
│── frontend/
│   ├── index.html           # Frontend interface
│   └── script.js            # JavaScript logic
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Groq API key (get from [console.groq.com](https://console.groq.com))

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd AI_Code_Review_Project/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   - Open `.env` file
   - Replace `your_groq_api_key_here` with your actual Groq API key

4. **Run the backend server**
   ```bash
   uvicorn main:app --reload
   ```
   
   Backend will run at: `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd AI_Code_Review_Project/frontend
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a live server for better development experience

## 📋 Features

### Backend (FastAPI)
- ✅ FastAPI server with CORS support
- ✅ Groq AI integration (Llama 3.3 70B model)
- ✅ Code review API endpoint
- ✅ Health check endpoint
- ✅ Error handling and validation

### Frontend (HTML/CSS/JS)
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Support for 14+ programming languages
- ✅ Real-time code review
- ✅ Loading states and animations
- ✅ Error handling and user feedback
- ✅ Keyboard shortcuts (Ctrl+Enter to review)
- ✅ Auto-resizing code textarea

## 🔧 API Endpoints

### GET `/`
Test endpoint - returns API status

### GET `/health`
Health check endpoint

### POST `/review`
Main code review endpoint

**Request Body:**
```json
{
    "code": "your code here",
    "language": "python"
}
```

**Response:**
```json
{
    "review": "AI review text...",
    "suggestions": ["suggestion 1", "suggestion 2"]
}
```

## 🎯 How It Works

1. **User Input**: User pastes code and selects language in the frontend
2. **API Request**: Frontend sends code to backend via POST request
3. **AI Processing**: Backend sends code to Groq AI for analysis
4. **Review Generation**: AI provides comprehensive code review
5. **Response**: Backend returns structured review to frontend
6. **Display**: Frontend shows results with formatting and suggestions

## 🛠️ Supported Languages

- Python
- JavaScript
- Java
- C++
- C
- C#
- PHP
- Ruby
- Go
- Rust
- TypeScript
- HTML
- CSS
- SQL

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Review code
- `Ctrl/Cmd + Shift + C`: Clear code

## 🎨 UI Features

- Dark theme with gradient background
- Responsive design for all devices
- Loading animations
- Status notifications
- Auto-resizing code input
- Syntax highlighting ready (can be enhanced)

## 🔒 Security Notes

- API key is stored in environment variables
- CORS is configured (adjust for production)
- Input validation on both frontend and backend

## 🚀 Running in Production

1. Set proper CORS origins in `main.py`
2. Use environment variables for all configuration
3. Add authentication/authorization as needed
4. Consider rate limiting for API usage
5. Use HTTPS in production

## 📝 Development Notes

- Backend runs on port 8000 by default
- Frontend connects to `http://127.0.0.1:8000`
- All dependencies are listed in `requirements.txt`
- Uses modern JavaScript (ES6+) features

## 🐛 Troubleshooting

### Backend Issues:
- Make sure all dependencies are installed
- Check that Groq API key is valid
- Verify port 8000 is not in use

### Frontend Issues:
- Check browser console for errors
- Ensure backend server is running
- Verify CORS configuration

### Connection Issues:
- Backend must be running before using frontend
- Check network connectivity
- Verify API endpoints are accessible

## 🎉 Ready to Use!

Your AI Code Review Assistant is now ready! Simply:

1. Start the backend server
2. Open the frontend in browser
3. Paste your code
4. Get instant AI-powered reviews!
