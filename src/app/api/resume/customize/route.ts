import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { 
      resumeContent, 
      jobDescription, 
      resumeFormat = 'text', 
      optimizationFocus = 'default',
      isJobDescriptionUrl = false
    } = json;
    
    if (!resumeContent || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume content and job description are required' },
        { status: 400 }
      );
    }
    
    // In production, this would call the backend API
    // For now, we'll simulate the backend response
    
    // Mock a job ID
    const jobId = 'job-' + Date.now();
    
    // Simulate calling your actual backend API
    // const response = await fetch('http://localhost:5000/api/v1/resume/customize', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     resumeContent,
    //     jobDescription,
    //     resumeFormat,
    //     optimizationFocus,
    //     isJobDescriptionUrl
    //   })
    // });
    
    // if (!response.ok) {
    //   return NextResponse.json(
    //     { error: 'Backend API request failed' },
    //     { status: response.status }
    //   );
    // }
    
    // const data = await response.json();
    
    // Mock a successful response
    return NextResponse.json({
      status: 'success',
      message: 'Resume customization job submitted successfully',
      data: {
        jobId
      }
    });
  } catch (error) {
    console.error('Error submitting customization job:', error);
    return NextResponse.json(
      { error: 'Failed to submit customization job' },
      { status: 500 }
    );
  }
}