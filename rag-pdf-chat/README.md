# RAG PDF Chat Application

A modern web application that allows users to upload PDF documents and chat with them using AI-powered RAG (Retrieval-Augmented Generation) technology.

## Features

- **PDF Viewer**: Real-time PDF viewing in the center of the interface
- **AI Chat**: Intelligent chatbot on the right side that can answer questions about the uploaded PDF
- **Real-time Processing**: Instant PDF processing and indexing
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Thai Language Support**: Full support for Thai language queries and responses

## Tech Stack

### Frontend (Next.js)
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- React PDF for PDF viewing
- Lucide React for icons

### Backend (FastAPI)
- FastAPI for API endpoints
- Sentence Transformers for embeddings
- FAISS for vector search
- BM25 for keyword search
- PyPDF2 for PDF text extraction
- LangChain for document processing

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd rag-pdf-chat
npm install
```

### 2. Install Backend Dependencies

```bash
cd ../backend
pip install -r requirements.txt
```

### 3. Environment Setup

Copy the `.env.example` file to `.env` in the backend directory and fill in your API credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
API_URL=your_llm_api_url_here
API_KEY=your_api_key_here
```

### 4. Run the Application

Start the backend server:
```bash
cd backend
python main.py
```

Start the frontend development server:
```bash
cd rag-pdf-chat
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your browser
2. Upload a PDF document using the file upload interface
3. Wait for the document to be processed and indexed
4. Start chatting with the AI about your document content
5. The AI will provide answers based on the document content with source references

## API Endpoints

- `POST /api/process-pdf` - Upload and process PDF documents
- `POST /api/chat` - Send chat messages and get AI responses
- `GET /api/health` - Health check endpoint

## Architecture

The application uses a hybrid search approach combining:
- **Semantic Search**: Using sentence transformers for meaning-based retrieval
- **Keyword Search**: Using BM25 for exact term matching
- **Reranking**: Combining both approaches for optimal results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
