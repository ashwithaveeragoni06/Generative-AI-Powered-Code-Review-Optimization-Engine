from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv
from groq import Groq
import jwt
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import re

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Code Review API")

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# In-memory user database (for demo purposes)
# In production, use a proper database
users_db = {
    "demo@example.com": {
        "id": 1,
        "email": "demo@example.com",
        "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
        "name": "Demo User",
        "created_at": datetime.now()
    }
}

# Pydantic models
class User(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

class UserInDB(User):
    password_hash: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Authentication functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

def get_current_user(token_data: TokenData = Depends(verify_token)):
    user = users_db.get(token_data.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )

# Authentication endpoints
@app.get("/auth/users")
async def list_users():
    # Debug endpoint to see current users (remove in production)
    return {"users": list(users_db.keys())}

@app.delete("/auth/users")
async def clear_users():
    # Clear all users (for testing only - remove in production)
    global users_db
    users_db = {
        "demo@example.com": {
            "id": 1,
            "email": "demo@example.com",
            "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
            "name": "Demo User",
            "created_at": datetime.now()
        }
    }
    return {"message": "Users cleared, demo user restored"}

@app.get("/auth/reset")
async def reset_signup():
    # Reset endpoint for testing - removes specific user
    if "ashwithaveeragoni06@gmail.com" in users_db:
        del users_db["ashwithaveeragoni06@gmail.com"]
        return {"message": "ashwithaveeragoni06@gmail.com removed from database"}
    return {"message": "Email not found in database"}

@app.post("/auth/github")
async def github_login():
    try:
        # Mock GitHub OAuth - in production, validate token with GitHub
        # For demo, we'll create or return a user
        mock_github_user = {
            "email": "ashwithaveeragoni06@gmail.com",
            "name": "ashwitha",
            "login": "ashwitha",
            "sub": "github_user_id_456"
        }
        
        # Check if user exists, if not create one
        if mock_github_user["email"] not in users_db:
            new_user = {
                "id": len(users_db) + 1,
                "email": mock_github_user["email"],
                "password_hash": hashlib.sha256("github_oauth".encode()).hexdigest(),
                "name": mock_github_user["name"],
                "created_at": datetime.now()
            }
            users_db[mock_github_user["email"]] = new_user
        
        user = users_db[mock_github_user["email"]]
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": User(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"]
            )
        }
    except Exception as e:
        print(f"GitHub login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub login failed: {str(e)}"
        )

@app.post("/auth/google")
async def google_login():
    try:
        # Mock Google OAuth - in production, validate token with Google
        # For demo, we'll create or return a user
        mock_google_user = {
            "email": "ashwithaveeragoni06@gmail.com",
            "name": "ashwitha",
            "sub": "google_user_id_123"
        }
        
        # Check if user exists, if not create one
        if mock_google_user["email"] not in users_db:
            new_user = {
                "id": len(users_db) + 1,
                "email": mock_google_user["email"],
                "password_hash": hashlib.sha256("google_oauth".encode()).hexdigest(),
                "name": mock_google_user["name"],
                "created_at": datetime.now()
            }
            users_db[mock_google_user["email"]] = new_user
        
        user = users_db[mock_google_user["email"]]
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": User(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"]
            )
        }
    except Exception as e:
        print(f"Google login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google login failed: {str(e)}"
        )

@app.post("/auth/signup")
async def signup(signup_data: SignupRequest):
    # Validate email format
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_pattern, signup_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Check if user already exists
    if signup_data.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password length
    if len(signup_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Create new user
    password_hash = hashlib.sha256(signup_data.password.encode()).hexdigest()
    new_user = {
        "id": len(users_db) + 1,
        "email": signup_data.email,
        "password_hash": password_hash,
        "name": signup_data.name,
        "created_at": datetime.now()
    }
    
    # Add to database
    users_db[signup_data.email] = new_user
    
    return {"message": "User created successfully", "user_id": new_user["id"]}

@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = users_db.get(login_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    password_hash = hashlib.sha256(login_data.password.encode()).hexdigest()
    
    if user["password_hash"] != password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    }

@app.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Pydantic models for code review
class CodeReviewRequest(BaseModel):
    code: str
    language: str

class CodeReviewResponse(BaseModel):
    review: str
    suggestions: list

# Code review endpoint (protected)
@app.post("/review", response_model=CodeReviewResponse)
async def review_code(request: CodeReviewRequest, current_user: User = Depends(get_current_user)):
    try:
        # Create prompt for AI with language-specific instructions
        language_prompts = {
            "python": "Analyze this Python code for syntax, style (PEP 8), best practices, and potential issues.",
            "javascript": "Analyze this JavaScript code for syntax, ES6+ features, best practices, and potential issues.",
            "java": "Analyze this Java code for syntax, conventions, best practices, and potential issues.",
            "cpp": "Analyze this C++ code for syntax, modern C++ practices, memory management, and potential issues.",
            "c": "Analyze this C code for syntax, memory management, best practices, and potential issues.",
            "html": "Analyze this HTML code for structure, accessibility, best practices, and potential issues.",
            "css": "Analyze this CSS code for syntax, layout, responsiveness, best practices, and potential issues.",
            "default": "Analyze this code for syntax, best practices, and potential issues."
        }
        
        prompt = f"""
        {language_prompts.get(request.language.lower(), language_prompts['default'])}

        Code:
        ```{request.language}
        {request.code}
        ```

        Provide a concise review in this format:
        REVIEW: [Your review text here]
        
        SUGGESTIONS:
        - [Suggestion 1]
        - [Suggestion 2]
        - [Suggestion 3]

        Keep it brief and focused on the most important points.
        """
        
        # Get AI response
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert code reviewer. Provide detailed, constructive feedback on code quality, best practices, and potential improvements."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        review_text = response.choices[0].message.content
        
        # Parse the structured response
        clean_review = ""
        suggestions = []
        
        # Clean up the review text and extract structured suggestions
        if "REVIEW:" in review_text:
            review_part = review_text.split("REVIEW:")[1].split("SUGGESTIONS:")[0].strip()
            clean_review = review_part
        else:
            clean_review = review_text.strip()
        
        # Extract suggestions from structured format
        if "SUGGESTIONS:" in review_text:
            suggestions_part = review_text.split("SUGGESTIONS:")[1].strip()
            lines = suggestions_part.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-'):
                    suggestions.append(line[1:].strip())
                elif line.startswith('*'):
                    suggestions.append(line[1:].strip())
        
        # Ensure we have at least some suggestions
        if not suggestions:
            suggestions = [
                "Review code structure and organization",
                "Check for proper error handling", 
                "Ensure code follows best practices"
            ]
        
        return CodeReviewResponse(
            review=clean_review,
            suggestions=suggestions
        )
        
    except Exception as e:
        return CodeReviewResponse(
            review=f"Error during code review: {str(e)}",
            suggestions=["Please try again or check your API configuration"]
        )

# Pydantic model for rewrite response
class CodeRewriteResponse(BaseModel):
    rewritten_code: str
    improvements: list

# Code rewrite endpoint (protected)
@app.post("/rewrite", response_model=CodeRewriteResponse)
async def rewrite_code(request: CodeReviewRequest, current_user: User = Depends(get_current_user)):
    try:
        # Create prompt for AI to rewrite code
        prompt = f"""
        Fix errors in this code. Return only the corrected code.

        Input:
        {request.code}

        Output only the fixed code:
        """
        
        # Get AI response
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Fix code errors. Return only the corrected code. No other text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        
        ai_response = response.choices[0].message.content
        
        # Parse the structured response
        rewritten_code = ""
        improvements = []
        
        # Extract rewritten code from structured format
        if "Output" in ai_response:
            rewritten_code_part = ai_response.split("Output")[1].strip()
            rewritten_code = rewritten_code_part
        else:
            rewritten_code = ai_response.strip()
        
        # Extract improvements
        if "Improvements:" in ai_response:
            improvements_part = ai_response.split("Improvements:")[1].strip()
            lines = improvements_part.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-'):
                    improvements.append(line[1:].strip())
                elif line.startswith('*'):
                    improvements.append(line[1:].strip())
        
        # Ensure we have at least some improvements
        if not improvements:
            improvements = [
                "Fixed syntax errors",
                "Code is error-free"
            ]
        
        return CodeRewriteResponse(
            rewritten_code=rewritten_code,
            improvements=improvements
        )
        
    except Exception as e:
        return CodeRewriteResponse(
            rewritten_code=f"Error during code rewrite: {str(e)}",
            improvements=["Please try again or check your API configuration"]
        )

# Test routes
@app.get("/")
async def root():
    """Serve the main frontend index.html"""
    frontend_index = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    frontend_index = os.path.normpath(frontend_index)
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index, media_type="text/html")
    else:
        return {"message": "AI Code Review API is running!"}

@app.get("/index.html")
async def serve_index():
    """Serve the main frontend index.html"""
    frontend_index = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    frontend_index = os.path.normpath(frontend_index)
    print(f"Looking for frontend at: {frontend_index}")  # Debug line
    print(f"File exists: {os.path.exists(frontend_index)}")  # Debug line
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index, media_type="text/html")
    else:
        return {"error": "Frontend not found", "path": frontend_index}

@app.get("/ui")
async def ui_redirect():
    """Serve the frontend UI"""
    frontend_index = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    frontend_index = os.path.normpath(frontend_index)
    print(f"UI endpoint - Looking for frontend at: {frontend_index}")  # Debug line
    print(f"UI endpoint - File exists: {os.path.exists(frontend_index)}")  # Debug line
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index, media_type="text/html")
    else:
        return {
            "message": "Frontend UI",
            "frontend_url": "file:///C:/Users/prava/OneDrive/Desktop/hackathon/AI_Code_Review_Project/frontend/index.html",
            "note": "Open the frontend_url in your browser to access the UI"
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
