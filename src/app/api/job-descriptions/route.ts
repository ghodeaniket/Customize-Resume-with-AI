import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescription } from '@/utils/ai-service';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { title, content, sourceUrl } = json;
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would:
    // 1. Use an AI service to analyze the job description
    // 2. Save to database using Prisma
    
    // For the MVP, we'll run a simplified analysis
    // This is a mockup of what would happen
    const analyzedData = await analyzeJobDescription(content, title);
    
    // Mock successful response
    return NextResponse.json({
      id: 'mock-id-' + Date.now(),
      title,
      content,
      sourceUrl: sourceUrl || null,
      analyzedData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing job description:', error);
    return NextResponse.json(
      { error: 'Failed to process job description' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // In a real implementation, this would fetch job descriptions from the database
    // For the MVP, we'll return mock data
    
    const mockJobDescriptions = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'Enterprise Corp',
        sourceUrl: 'https://example.com/job-posting-1',
        createdAt: '2024-03-21T10:00:00Z',
      },
      {
        id: '2',
        title: 'Full Stack Developer',
        company: 'Tech Startup',
        sourceUrl: 'https://example.com/job-posting-2',
        createdAt: '2024-03-18T14:30:00Z',
      },
    ];
    
    return NextResponse.json(mockJobDescriptions);
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job descriptions' },
      { status: 500 }
    );
  }
}