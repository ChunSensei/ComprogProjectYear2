from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import shutil
from typing import List, Optional
import uvicorn

from core.rag_service import RAGService
from core.pdf_processor import PDFProcessor

app = FastAPI(title="RAG PDF Chat API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
rag_service = RAGService.get_instance()
pdf_processor = PDFProcessor()

class ChatRequest(BaseModel):
    message: str
    filename: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]

@app.post("/api/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    """Process uploaded PDF and create RAG index"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        # Process PDF and create index (without progress callback for now)
        success = await pdf_processor.process_pdf(tmp_path, file.filename)
        
        # Clean up temporary file
        os.unlink(tmp_path)
        
        if success:
            return {"message": "PDF processed successfully", "filename": file.filename}
        else:
            raise HTTPException(status_code=500, detail="Failed to process PDF")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the processed PDF"""
    try:
        response = await rag_service.query(request.message, request.filename)
        return ChatResponse(
            answer=response["answer"],
            sources=response["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
