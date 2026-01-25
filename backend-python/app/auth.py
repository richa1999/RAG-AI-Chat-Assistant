"""
Simple authentication system
For production, use proper OAuth2/JWT with secure password hashing
"""
from typing import Optional
import hashlib
import secrets

class User:
    def __init__(self, user_id: str, username: str, password_hash: str):
        self.user_id = user_id
        self.username = username
        self.password_hash = password_hash

class AuthManager:
    def __init__(self):
        self.users = {}  # username -> User
        self.tokens = {}  # token -> user_id
        
        # Create a demo user
        self._create_demo_user()
    
    def _create_demo_user(self):
        """Create demo user for testing"""
        demo_username = "demo"
        demo_password = "demo123"
        user_id = "demo_user_001"
        password_hash = self._hash_password(demo_password)
        
        self.users[demo_username] = User(user_id, demo_username, password_hash)
    
    def _hash_password(self, password: str) -> str:
        """Hash password with SHA-256 (use bcrypt in production)"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register(self, username: str, password: str) -> Optional[str]:
        """Register a new user"""
        if username in self.users:
            return None
        
        user_id = f"user_{secrets.token_hex(8)}"
        password_hash = self._hash_password(password)
        self.users[username] = User(user_id, username, password_hash)
        
        return user_id
    
    def login(self, username: str, password: str) -> Optional[str]:
        """Login user and return auth token"""
        if username not in self.users:
            return None
        
        user = self.users[username]
        password_hash = self._hash_password(password)
        
        if password_hash == user.password_hash:
            # Generate auth token
            token = secrets.token_urlsafe(32)
            self.tokens[token] = user.user_id
            return token
        
        return None
    
    def verify_token(self, token: str) -> Optional[str]:
        """Verify auth token and return user_id"""
        return self.tokens.get(token)
    
    def logout(self, token: str):
        """Logout user by removing token"""
        if token in self.tokens:
            del self.tokens[token]
    
    def get_user_id(self, username: str) -> Optional[str]:
        """Get user ID by username"""
        if username in self.users:
            return self.users[username].user_id
        return None

# Global auth manager instance
auth_manager = AuthManager()
