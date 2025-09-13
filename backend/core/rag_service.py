import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
from langchain.schema import Document
from typing import List, Dict, Any, Tuple
import asyncio

from .llm_client import LLMClient

# Global instance to maintain state across requests
_rag_service_instance = None

class RAGService:
    def __init__(self):
        self.embedder = SentenceTransformer("intfloat/multilingual-e5-large")
        self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.llm_client = LLMClient()
        self.document_stores = {}  # filename -> document store
        self.indices = {}  # filename -> (faiss_index, bm25, docs)
    
    @classmethod
    def get_instance(cls):
        global _rag_service_instance
        if _rag_service_instance is None:
            _rag_service_instance = cls()
        return _rag_service_instance
        
    async def create_index(self, documents: List[Document], filename: str, progress_callback=None):
        """Create FAISS and BM25 indices for documents"""
        try:
            if progress_callback:
                await progress_callback(20, "กำลังเตรียมข้อมูลเอกสาร...")
            
            # Extract text content
            texts = [doc.page_content for doc in documents]
            
            if progress_callback:
                await progress_callback(40, "กำลังสร้าง Vector Embeddings...")
            
            # Create embeddings with batch processing for better performance
            embeddings = self.embedder.encode(
                texts, 
                show_progress_bar=False, 
                normalize_embeddings=True,
                batch_size=32,  # Process in smaller batches
                convert_to_numpy=True
            )
            
            if progress_callback:
                await progress_callback(70, "กำลังสร้าง FAISS Index...")
            
            # Create FAISS index
            faiss_index = faiss.IndexFlatIP(embeddings.shape[1])
            faiss_index.add(np.array(embeddings, dtype=np.float32))
            
            if progress_callback:
                await progress_callback(85, "กำลังสร้าง BM25 Index...")
            
            # Create BM25 index
            tokenized_corpus = [text.split() for text in texts]
            bm25_index = BM25Okapi(tokenized_corpus)
            
            if progress_callback:
                await progress_callback(95, "กำลังบันทึก Index...")
            
            # Store indices
            self.indices[filename] = (faiss_index, bm25_index, documents)
            
            if progress_callback:
                await progress_callback(100, "เสร็จสิ้น!")
            
            return True
        except Exception as e:
            print(f"Error creating index: {e}")
            return False
    
    def hybrid_search(self, query: str, filename: str, top_k: int = 10, use_reranker: bool = True) -> List[Document]:
        """Perform hybrid search using semantic, keyword search and reranking"""
        if filename not in self.indices:
            return []
        
        faiss_index, bm25_index, documents = self.indices[filename]
        
        # Step 1: Initial retrieval with semantic search (FAISS)
        query_embedding = self.embedder.encode(
            [query], 
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        semantic_scores, semantic_indices = faiss_index.search(
            np.array(query_embedding, dtype=np.float32), top_k * 2  # Retrieve more candidates for reranking
        )
        
        # Step 2: Keyword search with BM25
        query_tokens = query.split()
        bm25_scores = bm25_index.get_scores(query_tokens)
        
        # Combine scores (normalize and weight)
        semantic_scores = semantic_scores[0]
        semantic_indices = semantic_indices[0]
        
        # Normalize BM25 scores
        if len(bm25_scores) > 0:
            max_bm25 = max(bm25_scores)
            if max_bm25 > 0:
                bm25_scores = bm25_scores / max_bm25
        
        # Combine scores for documents found by semantic search
        combined_results = []
        for i, doc_idx in enumerate(semantic_indices):
            if doc_idx < len(documents):
                combined_score = 0.7 * semantic_scores[i] + 0.3 * bm25_scores[doc_idx]
                combined_results.append((combined_score, doc_idx))
        
        # Sort by combined score
        combined_results.sort(reverse=True, key=lambda x: x[0])
        
        # Step 3: Apply reranker if enabled
        if use_reranker and len(combined_results) > 0:
            # Get top candidates from initial retrieval
            candidate_indices = [idx for _, idx in combined_results[:min(top_k * 2, len(combined_results))]]
            
            # Prepare query-document pairs for reranking
            rerank_pairs = []
            for doc_idx in candidate_indices:
                doc_text = documents[doc_idx].page_content
                rerank_pairs.append((query, doc_text))
            
            # Apply reranker
            rerank_scores = self.reranker.predict(rerank_pairs)
            
            # Create new results with reranker scores
            reranked_results = [(score, candidate_indices[i]) for i, score in enumerate(rerank_scores)]
            
            # Sort by reranker score
            reranked_results.sort(reverse=True, key=lambda x: x[0])
            
            # Use reranked results
            final_results = reranked_results[:top_k]
        else:
            # Use original results if reranker is disabled
            final_results = combined_results[:top_k]
        
        # Return top documents
        result_docs = []
        for score, doc_idx in final_results:
            doc = documents[doc_idx]
            doc.metadata['relevance_score'] = float(score)
            result_docs.append(doc)
        
        return result_docs
    
    async def query(self, question: str, filename: str) -> Dict[str, Any]:
        """Query the RAG system"""
        try:
            # Retrieve relevant documents
            relevant_docs = self.hybrid_search(question, filename, top_k=5)
            
            if not relevant_docs:
                return {
                    "answer": "ขออภัยครับ ไม่พบข้อมูลที่เกี่ยวข้องในเอกสาร",
                    "sources": []
                }
            
            # Generate answer using LLM
            answer = await self.llm_client.generate_answer(question, relevant_docs)
            
            # Format sources
            sources = []
            for doc in relevant_docs:
                sources.append({
                    "source": doc.metadata.get("source", filename),
                    "page": doc.metadata.get("page", 1),
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "relevance_score": doc.metadata.get("relevance_score", 0.0)
                })
            
            return {
                "answer": answer,
                "sources": sources
            }
            
        except Exception as e:
            print(f"Error in query: {e}")
            return {
                "answer": f"เกิดข้อผิดพลาด: {str(e)}",
                "sources": []
            }
