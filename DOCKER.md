# RAG AI Chat Assistant - Docker Deployment

Production-ready RAG (Retrieval-Augmented Generation) chatbot with Docker & Docker Compose.

## 🐳 Quick Start with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Run the Application

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Stop the Application

```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 📦 Architecture

```
┌─────────────────┐      ┌─────────────────┐
│   Frontend      │─────→│    Backend      │
│   (Next.js)     │      │   (FastAPI)     │
│   Port: 3000    │      │   Port: 8000    │
└─────────────────┘      └─────────────────┘
                               │
                               ▼
                         ┌──────────────┐
                         │ Vector Store │
                         │   (FAISS)    │
                         └──────────────┘
```

## 🛠️ Services

### Backend (Python/FastAPI)
- Base image: `python:3.9-slim`
- Port: `8000`
- Features:
  - Sentence Transformers embeddings
  - FAISS vector search
  - Streaming responses
  - CORS enabled

### Frontend (Next.js)
- Base image: `node:20-alpine`
- Port: `3000`
- Features:
  - Multi-stage build (optimized)
  - Standalone output mode
  - Markdown rendering
  - Real-time streaming

## 📝 Development

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild everything
docker-compose up -d --build
```

### Access Container Shell

```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh
```

## 🔧 Configuration

### Environment Variables

Backend (`backend-python/.env`):
```env
TOKENIZERS_PARALLELISM=false
OMP_NUM_THREADS=1
```

Frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Volumes

- `./backend-python/app/vector_store`: Persisted FAISS index
- `./backend-python/data`: Document storage

## 🚀 Production Deployment

### Build Images

```bash
# Build backend
docker build -t rag-backend:latest ./backend-python

# Build frontend
docker build -t rag-frontend:latest ./frontend-next
```

### Push to Registry

```bash
# Tag images
docker tag rag-backend:latest your-registry/rag-backend:latest
docker tag rag-frontend:latest your-registry/rag-frontend:latest

# Push
docker push your-registry/rag-backend:latest
docker push your-registry/rag-frontend:latest
```

### Deploy to Cloud

**AWS ECS / Azure Container Instances / GCP Cloud Run:**
- Use the built images from your registry
- Set environment variables
- Configure load balancer for port 3000

**Kubernetes:**
```bash
kubectl create deployment rag-backend --image=your-registry/rag-backend:latest
kubectl create deployment rag-frontend --image=your-registry/rag-frontend:latest
kubectl expose deployment rag-backend --port=8000
kubectl expose deployment rag-frontend --port=3000 --type=LoadBalancer
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :8000

# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

### Backend Not Starting

```bash
# Check logs
docker-compose logs backend

# Ensure vector store exists
ls -la backend-python/app/vector_store/
```

### Frontend Can't Connect to Backend

1. Check network: `docker network ls`
2. Verify backend is running: `docker-compose ps`
3. Test API: `curl http://localhost:8000/`

## 📊 Resource Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB for images + models

## 🔐 Security Considerations

- [ ] Use secrets management for API keys
- [ ] Enable HTTPS with reverse proxy (nginx)
- [ ] Implement rate limiting
- [ ] Add authentication middleware
- [ ] Regular security updates

## 📚 Additional Commands

```bash
# Remove all containers and images
docker-compose down --rmi all

# Clean up everything
docker system prune -a --volumes

# Check resource usage
docker stats

# Export/Import vector store
docker-compose exec backend tar -czf /tmp/vector_store.tar.gz /app/app/vector_store
docker cp rag-backend:/tmp/vector_store.tar.gz ./backup/
```

## 🎯 Skills Demonstrated

✅ Docker containerization  
✅ Multi-stage builds  
✅ Docker Compose orchestration  
✅ Volume management  
✅ Network configuration  
✅ Health checks  
✅ Production optimization  
✅ Container best practices  

Perfect for showcasing in job interviews and portfolios! 🚀
