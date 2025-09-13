'use client'

import { useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
  processingProgress?: number
  processingStep?: string
}

export default function FileUpload({ onFileUpload, isProcessing, processingProgress = 0, processingStep = '' }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const pdfFile = files.find(file => file.type === 'application/pdf')
      if (pdfFile) {
        onFileUpload(pdfFile)
      }
    },
    [onFileUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type === 'application/pdf') {
        onFileUpload(file)
      }
    },
    [onFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="pdf-upload"
        disabled={isProcessing}
      />
      <label htmlFor="pdf-upload" className="cursor-pointer">
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              กำลังประมวลผลเอกสาร...
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-xs mb-3">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{processingProgress}%</span>
                <span>100%</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-center">
              {processingStep || 'กรุณารอสักครู่ ระบบกำลังสร้าง Index สำหรับเอกสารของคุณ'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-gray-600">
              รองรับไฟล์ PDF เท่านั้น (ขนาดไม่เกิน 10MB)
            </p>
          </div>
        )}
      </label>
    </div>
  )
}
