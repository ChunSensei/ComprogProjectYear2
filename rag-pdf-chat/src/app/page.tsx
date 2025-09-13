'use client'

import { useState, useEffect } from 'react'
import PDFViewer from '@/components/PDFViewer'
import ChatInterface from '@/components/ChatInterface'
import FileUpload from '@/components/FileUpload'
import { Upload, MessageCircle, FileText } from 'lucide-react'

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setPdfFile(file)
    
    // Create object URL for PDF display
    const url = URL.createObjectURL(file)
    setPdfUrl(url)
    
    // Simulate progress steps
    const steps = [
      { progress: 20, step: 'กำลังอัปโหลดไฟล์...' },
      { progress: 40, step: 'กำลังแยกข้อความจาก PDF...' },
      { progress: 60, step: 'กำลังแบ่งเอกสารเป็นส่วนย่อย...' },
      { progress: 80, step: 'กำลังสร้าง Vector Embeddings...' },
      { progress: 95, step: 'กำลังสร้าง Search Index...' },
      { progress: 100, step: 'เสร็จสิ้น!' }
    ]
    
    // Process the PDF for RAG
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      // Start progress simulation
      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
          setProcessingProgress(steps[currentStep].progress)
          setProcessingStep(steps[currentStep].step)
          currentStep++
        }
      }, 800)
      
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(progressInterval)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to process PDF')
      }
      
      const result = await response.json()
      
      // Complete progress
      setProcessingProgress(100)
      setProcessingStep('เสร็จสิ้น!')
      
      // Wait a bit before hiding progress
      setTimeout(() => {
        setProcessingProgress(0)
        setProcessingStep('')
      }, 1000)
      
      console.log('PDF processed successfully:', result.message)
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert(`เกิดข้อผิดพลาดในการประมวลผล PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Reset state on error
      setPdfFile(null)
      setPdfUrl(null)
      if (url) URL.revokeObjectURL(url)
      setProcessingProgress(0)
      setProcessingStep('')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RAG PDF Chat</h1>
                <p className="text-sm text-gray-600">AI-Powered Document Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MessageCircle className="h-4 w-4" />
              <span>Real-time Chat</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!pdfFile ? (
          /* Upload Area */
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  อัปโหลดเอกสาร PDF
                </h2>
                <p className="text-gray-600">
                  เลือกไฟล์ PDF เพื่อเริ่มการสนทนากับเอกสารของคุณ
                </p>
              </div>
              <FileUpload 
                onFileUpload={handleFileUpload} 
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                processingStep={processingStep}
              />
            </div>
          </div>
        ) : (
          /* PDF Viewer + Chat Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* PDF Viewer - Takes 2/3 of the width */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{pdfFile.name}</span>
                </div>
                <button
                  onClick={() => {
                    setPdfFile(null)
                    setPdfUrl(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>
              <div className="pdf-viewer">
                {pdfUrl && <PDFViewer pdfUrl={pdfUrl} />}
              </div>
            </div>

            {/* Chat Interface - Takes 1/3 of the width */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 text-white">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">แชทบอท AI</span>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  ถามคำถามเกี่ยวกับเอกสารของคุณ
                </p>
              </div>
              <div className="chat-container">
                <ChatInterface pdfFile={pdfFile} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
