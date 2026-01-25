# 🤖 RAG AI Chat Assistant

A production-ready **Retrieval-Augmented Generation (RAG)** chatbot with authentication, session management, and real-time streaming responses. Built with FastAPI, Next.js, and FAISS vector store.

[![Python](https://img.shields.io/badge/Python-3.9-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## ✨ Features

- 🔐 **Authentication System** - Secure token-based authentication with user registration and login
- 💬 **Real-time Streaming** - Server-Sent Events (SSE) for instant response delivery
- 📚 **RAG Implementation** - Document retrieval using FAISS vector store with semantic search
- 🎯 **Citations** - Source documents displayed with relevance scores and previews
- 📋 **Copy Functionality** - One-click copy for AI responses
- ⛔ **Abort Generation** - Cancel long-running queries mid-stream
- 🔄 **Session Management** - Per-user chat history with automatic cleanup
- 🐳 **Dockerized** - Multi-stage builds with docker-compose orchestration
- 🎨 **Modern UI** - Beautiful gradient design with dark mode support
- 📱 **Responsive** - Mobile-friendly interface

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │ ───► │  FastAPI     │ ───► │   FAISS     │
│  Frontend   │      │   Backend    │      │ Vector Store│
│  (Port 3000)│ ◄─── │  (Port 8000) │ ◄─── │             │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │
      │                      ▼
      │              ┌──────────────┐
      └─────────────►│ Auth Manager │
                     │ + Sessions   │
                     └──────────────┘
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **sentence-transformers** - all-mpnet-base-v2 embeddings (768D)
- **FAISS** - Facebook AI Similarity Search for vector operations
- **Uvicorn** - ASGI server for production

### Frontend
- **Next.js 16.1.4** - React framework with standalone output
- **React 19** - Latest React with streaming support
- **Tailwind CSS 4** - Utility-first styling
- **react-markdown** - Markdown rendering with syntax highlighting
- **Lucide Icons** - Beautiful icon set

### Infrastructure
- **Docker** - Containerization with multi-stage builds
- **docker-compose** - Service orchestration
- **Health checks** - Automated service monitoring

## 📋 Prerequisites

- **Docker** and **Docker Compose** (recommended)
- OR manually:
  - Python 3.9+
  - Node.js 18+
  - npm/yarn

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RAG-AI-Chat-Assistant
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Login with demo account**
   - Username: `demo`
   - Password: `demo123`

## 💻 Manual Setup

### Backend Setup

```bash
cd backend-python

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
cd app
python -m uvicorn main:app --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend-next

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📁 Project Structure

```
RAG-AI-Chat-Assistant/
├── backend-python/
│   ├── app/
│   │   ├── main.py              # FastAPI application & endpoints
│   │   ├── rag.py               # RAG logic with FAISS
│   │   ├── auth.py              # Authentication manager
│   │   ├── session_manager.py  # Session & chat history
│   │   ├── prompts.py           # System prompts
│   │   ├── ingest.py            # Document ingestion
│   │   └── vector_store/        # FAISS index storage
│   ├── data/
│   │   └── docs/                # Source documents
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-next/
│   ├── app/
│   │   ├── page.tsx             # Main app with auth
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts     # API proxy route
│   ├── components/
│   │   ├── ChatBox.tsx          # Chat interface
│   │   └── Login.tsx            # Login/register UI
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔐 Authentication

### Register New User
```bash
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass123"}'
```

Response:
```json
{
  "token": "abc123...",
  "session_id": "uuid-here",
  "message": "Login successful"
}
```

## 📡 API Endpoints

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat` | Non-streaming chat | ✅ |
| POST | `/chat/stream` | Streaming chat with SSE | ✅ |
| POST | `/register` | Create new user | ❌ |
| POST | `/login` | Authenticate user | ❌ |
| POST | `/logout` | End session | ✅ |

### Chat Request Format

```json
{
  "message": "What is the remote work policy?",
  "session_id": "uuid-here"
}
```

### Streaming Response Format

```
data: {"text": "Based on"}
data: {"text": " the documents,"}
data: {"text": " the policy is..."}
data: {"citations": [
  {
    "index": 1,
    "title": "Remote Work Policy",
    "relevance": 0.89,
    "preview": "Our remote work policy allows..."
  }
]}
```

## 🎨 Features in Detail

### Citations System
- Extracts top 3 most relevant documents
- Displays document title (from first line)
- Shows relevance score as percentage
- Includes text preview (200 chars)
- Visual badges for easy reference

### Session Management
- UUID-based session tracking
- 60-minute automatic timeout
- Per-user chat history
- Automatic cleanup of expired sessions

### Streaming Implementation
- Line-by-line token delivery
- JSON parsing with brace counting
- Markdown rendering with syntax highlighting
- Graceful error handling

### Abort Functionality
- AbortController for fetch cancellation
- Visual stop button during generation
- Clean state management
- "[Generation stopped]" feedback

## 🐳 Docker Configuration

### Backend Dockerfile
- Multi-stage build
- Python 3.9 slim base
- Optimized layer caching
- Health check included

### Frontend Dockerfile
- Next.js standalone output
- Production-optimized build
- Minimal runtime image
- Environment variable support

### docker-compose.yml
- Service networking
- Health checks with dependencies
- Volume mounts for data persistence
- Port mapping (3000, 8000)

## 📊 Vector Store

- **Model**: sentence-transformers/all-mpnet-base-v2
- **Dimensions**: 768
- **Index Type**: FAISS IndexFlatL2 (L2 distance)
- **Storage**: Pickle for text, FAISS binary for vectors
- **Search**: Top-k retrieval with similarity scores

### Adding Documents

```bash
# Place documents in backend-python/data/docs/
cd backend-python/app
python ingest.py
```

## 🔧 Configuration

### Environment Variables

**Backend:**
- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)

**Frontend:**
- `BACKEND_URL` - Backend service URL (docker: http://backend:8000)
- `NEXT_PUBLIC_API_URL` - Public API URL (default: /api/chat)

## 🧪 Testing

### Test Authentication
```bash
# Register
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### Test Chat
```bash
# Get token from login response
TOKEN="your-token-here"

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"What is the company policy?","session_id":"test-session"}'
```

## 🚦 Health Checks

Backend health endpoint:
```bash
curl http://localhost:8000/
```

Response:
```json
{"message": "RAG Chat API is running"}
```

## 🎯 Roadmap

- [ ] OpenAI/Anthropic integration for better responses
- [ ] Document upload via UI
- [ ] Export chat history
- [ ] Dark mode persistence
- [ ] Citation click to expand full document
- [ ] Multi-language support
- [ ] Redis for session storage
- [ ] PostgreSQL for user management
- [ ] Rate limiting
- [ ] WebSocket support

## 🐛 Troubleshooting

### 401 Unauthorized Error
- Ensure token is in Authorization header: `Bearer <token>`
- Check token expiration
- Verify user is logged in

### Citations Not Showing
- Rebuild Docker: `docker-compose up --build`
- Check browser console for errors
- Verify FAISS index exists

### Streaming Not Working
- Check SSE headers in network tab
- Verify AbortController support
- Check backend logs for errors

### Docker Build Fails
- Increase Docker memory (4GB+ recommended)
- Clear Docker cache: `docker system prune -a`
- Check Dockerfile syntax

## 📄 License

MIT License - feel free to use this project for learning and portfolio purposes.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for job interviews and production deployment**