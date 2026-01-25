"""
Session and chat history management
"""
from typing import Dict, List
from datetime import datetime, timedelta
import uuid
import json

class ChatMessage:
    def __init__(self, role: str, content: str, timestamp: datetime = None):
        self.role = role  # 'user' or 'ai'
        self.content = content
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat()
        }

class Session:
    def __init__(self, session_id: str, user_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.chat_history: List[ChatMessage] = []
    
    def add_message(self, role: str, content: str):
        self.chat_history.append(ChatMessage(role, content))
        self.last_activity = datetime.now()
    
    def get_history(self, limit: int = 50):
        return [msg.to_dict() for msg in self.chat_history[-limit:]]
    
    def is_expired(self, timeout_minutes: int = 60) -> bool:
        return datetime.now() - self.last_activity > timedelta(minutes=timeout_minutes)

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.user_sessions: Dict[str, str] = {}  # user_id -> session_id
    
    def create_session(self, user_id: str) -> str:
        """Create a new session for a user"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = Session(session_id, user_id)
        self.user_sessions[user_id] = session_id
        return session_id
    
    def get_session(self, session_id: str) -> Session:
        """Get a session by ID"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            if not session.is_expired():
                return session
            else:
                # Clean up expired session
                del self.sessions[session_id]
                if session.user_id in self.user_sessions:
                    del self.user_sessions[session.user_id]
        return None
    
    def get_or_create_session(self, user_id: str, session_id: str = None) -> Session:
        """Get existing session or create new one"""
        if session_id and session_id in self.sessions:
            session = self.get_session(session_id)
            if session:
                return session
        
        # Create new session
        new_session_id = self.create_session(user_id)
        return self.sessions[new_session_id]
    
    def add_message(self, session_id: str, role: str, content: str):
        """Add a message to session history"""
        session = self.get_session(session_id)
        if session:
            session.add_message(role, content)
    
    def get_chat_history(self, session_id: str, limit: int = 50):
        """Get chat history for a session"""
        session = self.get_session(session_id)
        if session:
            return session.get_history(limit)
        return []
    
    def cleanup_expired_sessions(self):
        """Remove expired sessions"""
        expired = [sid for sid, session in self.sessions.items() if session.is_expired()]
        for sid in expired:
            session = self.sessions[sid]
            del self.sessions[sid]
            if session.user_id in self.user_sessions:
                del self.user_sessions[session.user_id]

# Global session manager instance
session_manager = SessionManager()
