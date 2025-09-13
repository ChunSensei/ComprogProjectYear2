'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, FileText } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    source: string
    page: number
    content: string
  }>
  timestamp: Date
}

interface ChatInterfaceProps {
  pdfFile: File | null
}

export default function ChatInterface({ pdfFile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Welcome message when PDF is loaded
    if (pdfFile && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `สวัสดีครับ! ผมพร้อมช่วยคุณวิเคราะห์เอกสาร "${pdfFile.name}" แล้ว คุณสามารถถามคำถามเกี่ยวกับเนื้อหาในเอกสารได้เลยครับ`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [pdfFile, messages.length])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !pdfFile) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          filename: pdfFile.name
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 break-words overflow-wrap-anywhere ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        แหล่งข้อมูลอ้างอิง:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <p className="font-medium text-gray-700">
                              หน้า {source.page} - {source.source}
                            </p>
                            <p className="text-gray-600 mt-1 line-clamp-2 break-words">
                              {source.content.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">กำลังคิด...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ถามคำถามเกี่ยวกับเอกสาร..."
            className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading || !pdfFile}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !pdfFile}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 px-1">
          <p className="text-xs text-gray-500 break-words leading-relaxed">
            กด Enter เพื่อส่งข้อความ, Shift+Enter เพื่อขึ้นบรรทัดใหม่
          </p>
        </div>
      </div>
    </div>
  )
}
