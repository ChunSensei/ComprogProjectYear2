import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, filename } = body

    if (!message || !filename) {
      return NextResponse.json(
        { error: 'Message and filename are required' },
        { status: 400 }
      )
    }

    // Forward to FastAPI backend
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        filename
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend chat error:', errorText)
      throw new Error(`Failed to get chat response from backend: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
