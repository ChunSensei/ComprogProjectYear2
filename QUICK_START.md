# Quick Start Commands

## Terminal 1 - Start Frontend
```bash
cd C:\2Year\Comprog\miniproject\RAGNTSystem\rag-pdf-chat
npm run dev
```

## Terminal 2 - Start Backend  
```bash
cd C:\2Year\Comprog\miniproject\RAGNTSystem\backend
python -m uvicorn main:app --reload --port 8000
```

## If Backend Dependencies Missing
```bash
pip install fastapi uvicorn python-multipart python-dotenv PyPDF2 langchain sentence-transformers faiss-cpu rank-bm25 numpy requests pydantic
```

## Access URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
