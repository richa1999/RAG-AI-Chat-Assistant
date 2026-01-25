"use client";

import { useState, useEffect } from "react";
import ChatBox from "@/components/ChatBox";
import Login from "@/components/Login";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Load auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedSessionId = localStorage.getItem("session_id");
    const savedUsername = localStorage.getItem("username");
    
    if (savedToken) {
      setToken(savedToken);
      setSessionId(savedSessionId);
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = (newToken: string, newSessionId: string, newUsername: string) => {
    setToken(newToken);
    setSessionId(newSessionId);
    setUsername(newUsername);
    
    // Save to localStorage
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("session_id", newSessionId);
    localStorage.setItem("username", newUsername);
  };

  const handleLogout = () => {
    setToken(null);
    setSessionId(null);
    setUsername(null);
    
    localStorage.removeItem("auth_token");
    localStorage.removeItem("session_id");
    localStorage.removeItem("username");
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main className="h-screen">
      <ChatBox 
        token={token} 
        sessionId={sessionId || undefined}
        username={username || undefined}
        onLogout={handleLogout}
      />
    </main>
  );
}

