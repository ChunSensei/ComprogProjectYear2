import os
import tempfile
from typing import List
import PyPDF2
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .rag_service import RAGService

class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,  # Smaller chunks for faster processing
            chunk_overlap=100,  # Reduced overlap
            length_function=len,
        )
        
    def extract_text_from_pdf(self, pdf_path: str) -> List[Document]:
        """Extract text from PDF and create Document objects"""
        documents = []
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text.strip():  # Only add non-empty pages
                        doc = Document(
                            page_content=text,
                            metadata={
                                "source": os.path.basename(pdf_path),
                                "page": page_num,
                                "total_pages": len(pdf_reader.pages)
                            }
                        )
                        documents.append(doc)
                        
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return []
        
        return documents
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into smaller chunks"""
        try:
            split_docs = []
            for doc in documents:
                chunks = self.text_splitter.split_documents([doc])
                for i, chunk in enumerate(chunks):
                    chunk.metadata["chunk_id"] = i
                    chunk.metadata["parent_id"] = f"{doc.metadata['source']}_{doc.metadata['page']}"
                    split_docs.append(chunk)
            return split_docs
        except Exception as e:
            print(f"Error splitting documents: {e}")
            return documents
    
    async def process_pdf(self, pdf_path: str, filename: str, progress_callback=None) -> bool:
        """Process PDF file and create RAG index"""
        try:
            if progress_callback:
                await progress_callback(10, "กำลังแยกข้อความจาก PDF...")
            
            # Extract text from PDF
            documents = self.extract_text_from_pdf(pdf_path)
            if not documents:
                return False
            
            if progress_callback:
                await progress_callback(20, "กำลังแบ่งเอกสารเป็นส่วนย่อย...")
            
            # Split documents into chunks
            split_docs = self.split_documents(documents)
            if not split_docs:
                return False
            
            # Create RAG index with progress callback
            rag_service = RAGService.get_instance()
            success = await rag_service.create_index(split_docs, filename, progress_callback)
            
            return success
            
        except Exception as e:
            print(f"Error processing PDF: {e}")
            return False
