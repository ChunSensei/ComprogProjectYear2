# Quick Setup Guide

## Start Frontend (Next.js)
Open terminal in the project root and run:
```bash
cd rag-pdf-chat
npm run dev
```

## Start Backend (FastAPI)
Open another terminal in the project root and run:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Install Backend Dependencies (if needed)
```bash
pip install fastapi uvicorn python-multipart python-dotenv PyPDF2 langchain sentence-transformers faiss-cpu rank-bm25 numpy requests pydantic
```

## Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Configuration
Make sure your `backend/.env` file has:
```
API_URL=https://api.openai.com/v1/chat/completions
API_KEY=your_openai_api_key_here
```
