import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle FormData
  },
};

// Helper to parse form data
async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  return { file };
}

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const { file } = await parseFormData(request);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Forward to FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append('file', new Blob([await file.arrayBuffer()]), file.name);

    const response = await fetch('http://localhost:8000/api/process-pdf', {
      method: 'POST',
      body: backendFormData,
      // Don't set Content-Type header, let the browser set it with the boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Failed to process PDF in backend: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Process PDF API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
