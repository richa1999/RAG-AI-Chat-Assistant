from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.rag import answer_question
from app.auth import auth_manager
from app.session_manager import session_manager
import json
import time

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "RAG AI Chat Assistant is running"}

# Auth endpoints
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
def login(req: LoginRequest):
    token = auth_manager.login(req.username, req.password)
    if token:
        user_id = auth_manager.verify_token(token)
        session_id = session_manager.create_session(user_id)
        return {
            "success": True,
            "token": token,
            "session_id": session_id,
            "username": req.username
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/register")
def register(req: RegisterRequest):
    user_id = auth_manager.register(req.username, req.password)
    if user_id:
        token = auth_manager.login(req.username, req.password)
        session_id = session_manager.create_session(user_id)
        return {
            "success": True,
            "token": token,
            "session_id": session_id,
            "username": req.username
        }
    raise HTTPException(status_code=400, detail="Username already exists")

@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        auth_manager.logout(token)
    return {"success": True}

# Chat endpoints with session support
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

def verify_auth(authorization: Optional[str]) -> str:
    """Verify auth token and return user_id"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    user_id = auth_manager.verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id

@app.get("/chat/history")
def get_history(
    session_id: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    user_id = verify_auth(authorization)
    
    if session_id:
        history = session_manager.get_chat_history(session_id)
        return {"history": history}
    
    return {"history": []}

@app.post("/chat")
def chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    user_id = verify_auth(authorization)
    
    # Get or create session
    session = session_manager.get_or_create_session(user_id, req.session_id)
    
    # Add user message to history
    session_manager.add_message(session.session_id, "user", req.message)
    
    # Get answer with citations
    result = answer_question(req.message)
    
    # Add AI response to history
    session_manager.add_message(session.session_id, "ai", result["answer"])
    
    return {
        "answer": result["answer"],
        "citations": result["citations"],
        "session_id": session.session_id
    }

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest, authorization: Optional[str] = Header(None)):
    user_id = verify_auth(authorization)
    
    # Get or create session
    session = session_manager.get_or_create_session(user_id, req.session_id)
    
    # Add user message to history
    session_manager.add_message(session.session_id, "user", req.message)
    
    async def generate():
        result = answer_question(req.message)
        answer = result["answer"]
        citations = result["citations"]
        
        # Stream the response line by line to preserve markdown formatting
        lines = answer.split('\n')
        for i, line in enumerate(lines):
            # Send the line with newline character
            chunk = line + ('\n' if i < len(lines) - 1 else '')
            yield f"data: {json.dumps({'chunk': chunk, 'session_id': session.session_id})}\n\n"
            time.sleep(0.02)  # Small delay for streaming effect
        
        # Add AI response to history
        session_manager.add_message(session.session_id, "ai", answer)
        
        # Send citations
        yield f"data: {json.dumps({'citations': citations, 'session_id': session.session_id})}\n\n"
        
        # Send end signal
        yield f"data: {json.dumps({'done': True, 'session_id': session.session_id})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
