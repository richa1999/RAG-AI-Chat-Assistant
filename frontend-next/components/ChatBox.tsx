"use client";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Sparkles, LogOut, Copy, Check, StopCircle, FileText } from "lucide-react";
import type { Components } from "react-markdown";

interface Message {
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
}

interface Citation {
  index: number;
  title: string;
  relevance: number;
  preview: string;
}

interface ChatBoxProps {
  token: string;
  sessionId?: string;
  username?: string;
  onLogout: () => void;
}

// Markdown components defined outside to avoid re-creation on each render
const markdownComponents: Components = {
  h1: ({ children, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-white" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2 text-gray-900 dark:text-white" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-lg font-semibold mt-2 mb-1 text-gray-900 dark:text-white" {...props}>{children}</h3>,
  p: ({ children, ...props }) => <p className="my-2 leading-relaxed text-gray-800 dark:text-gray-200" {...props}>{children}</p>,
  ul: ({ children, ...props }) => <ul className="list-disc pl-6 my-2 space-y-1 text-gray-800 dark:text-gray-200" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="list-decimal pl-6 my-2 space-y-1 text-gray-800 dark:text-gray-200" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="my-1 text-gray-800 dark:text-gray-200" {...props}>{children}</li>,
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
    ) : (
      <code className="block bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono" {...props}>{children}</code>
    );
  },
  pre: ({ children, ...props }) => <pre className="my-2" {...props}>{children}</pre>,
  strong: ({ children, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em className="italic text-gray-800 dark:text-gray-200" {...props}>{children}</em>,
  hr: ({ ...props }) => <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />,
  a: ({ children, href, ...props }) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
};

export default function ChatBox({ token, sessionId: initialSessionId, username, onLogout }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const abortGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  async function send() {
    if (!input.trim()) return;

    console.log("Sending message with token:", token ? "Token present" : "No token");

    const userMessage = input;
    setMessages(m => [...m, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    // Add empty AI message that will be populated with streaming content
    const aiMessageIndex = messages.length + 1;
    setMessages(m => [...m, { role: "ai", text: "" }]);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMessage, 
          stream: true,
          session_id: currentSessionId 
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      console.log("Starting stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream complete");
          break;
        }

        const text = decoder.decode(value, { stream: true });
        
        // Split by "data: " to get individual messages
        const messages = text.split("data: ");
        
        for (const msg of messages) {
          if (!msg.trim()) continue;
          
          try {
            // Find the end of JSON object by counting braces
            let jsonStr = "";
            let braceCount = 0;
            let inString = false;
            let escape = false;
            
            for (let i = 0; i < msg.length; i++) {
              const char = msg[i];
              
              if (escape) {
                jsonStr += char;
                escape = false;
                continue;
              }
              
              if (char === '\\') {
                escape = true;
                jsonStr += char;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                jsonStr += char;
                continue;
              }
              
              if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
              }
              
              jsonStr += char;
              
              // If we've closed all braces, we have the complete JSON
              if (braceCount === 0 && jsonStr.includes('}')) {
                break;
              }
            }
            
            if (jsonStr.trim()) {
              const data = JSON.parse(jsonStr);
              if (data.chunk !== undefined) {
                accumulatedText += data.chunk;
                setMessages(m => {
                  const newMessages = [...m];
                  newMessages[aiMessageIndex] = {
                    role: "ai",
                    text: accumulatedText,
                  };
                  return newMessages;
                });
              }
            }
          } catch (parseError) {
            // Silently skip - UI is already working
          }
        }
      }

      console.log("Final accumulated text length:", accumulatedText.length);
    } catch (error) {
      console.error("Streaming error:", error);
      
      // Check if this was an abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was aborted");
        // Message already updated by abortGeneration function
      } else {
        // Show error message for other errors
        setMessages(m => {
          const newMessages = [...m];
          newMessages[aiMessageIndex] = {
            role: "ai",
            text: "Sorry, I encountered an error. Please try again.",
          };
          return newMessages;
        });
      }
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RAG AI Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logged in as <span className="font-medium">{username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl mb-4">
                <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Welcome to RAG AI Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                I can help you find information from your documents. Try asking about:
              </p>
              <div className="mt-6 grid gap-3 max-w-2xl mx-auto">
                {[
                  "How do I connect devices to the SmartHome Hub?",
                  "What is the remote work policy?",
                  "How do I authenticate with the CloudStore API?",
                ].map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(question)}
                    className="text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-4 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "ai" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-700"
                }`}
              >
                {m.role === "user" && (
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                )}
                {m.role === "ai" && m.text && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">AI Response</span>
                      <button
                        onClick={() => copyToClipboard(m.text, i)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy message"
                      >
                        {copiedIndex === i ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} className="text-gray-500" />
                        )}
                      </button>
                    </div>
                    <div className="markdown-content text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={14} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Sources ({m.citations.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {m.citations.map((citation) => (
                            <div
                              key={citation.index}
                              className="text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {citation.index}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {citation.title}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                    {citation.preview}
                                  </div>
                                  <div className="mt-1 text-[10px] text-gray-500">
                                    Relevance: {(citation.relevance * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {m.role === "ai" && !m.text && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-700 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={loading}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            {loading ? (
              <button
                onClick={abortGeneration}
                className="flex-shrink-0 p-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                title="Stop generation"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {loading ? "Click stop to cancel generation" : "Press Enter to send, Shift+Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
