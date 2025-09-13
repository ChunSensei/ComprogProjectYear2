#!/usr/bin/env python3
"""
Startup script for the RAG PDF Chat backend
"""
import sys
import os
import subprocess

def install_requirements():
    """Install required packages"""
    requirements = [
        "fastapi",
        "uvicorn",
        "python-multipart", 
        "python-dotenv",
        "PyPDF2",
        "langchain",
        "sentence-transformers",
        "faiss-cpu",
        "rank-bm25",
        "numpy",
        "requests",
        "pydantic"
    ]
    
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")

def start_server():
    """Start the FastAPI server"""
    backend_path = os.path.join(os.path.dirname(__file__), "backend")
    os.chdir(backend_path)
    subprocess.run([sys.executable, "main.py"])

if __name__ == "__main__":
    print("🚀 Starting RAG PDF Chat Backend...")
    print("📦 Installing dependencies...")
    install_requirements()
    print("🌟 Starting server...")
    start_server()
