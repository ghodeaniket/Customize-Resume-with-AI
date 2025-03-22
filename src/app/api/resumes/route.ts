import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // In a real implementation, this would:
    // 1. Parse the form data to get the uploaded file
    // 2. Extract text from the file (PDF or DOCX)
    // 3. Save the file to cloud storage
    // 4. Parse the resume text to extract structured data
    // 5. Save to database using Prisma

    // For the MVP, we'll implement a mock
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    
    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileType = file.type;
    if (
      fileType !== 'application/pdf' &&
      fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }
    
    // Mock successful response
    return NextResponse.json({
      id: 'mock-id-' + Date.now(),
      title,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing resume upload:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // In a real implementation, this would fetch resumes from the database
    // For the MVP, we'll return mock data
    
    const mockResumes = [
      {
        id: '1',
        title: 'Software Engineer Resume',
        fileName: 'resume.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        createdAt: '2024-03-20T10:00:00Z',
      },
      {
        id: '2',
        title: 'Product Manager Resume',
        fileName: 'pm_resume.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 125000,
        createdAt: '2024-03-15T14:30:00Z',
      },
    ];
    
    return NextResponse.json(mockResumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}