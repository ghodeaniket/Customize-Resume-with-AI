import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // In production, this would call the backend API
    // For now, we'll simulate the backend response
    
    // Simulate calling your actual backend API
    // const response = await fetch(`http://localhost:5000/api/v1/resume/status/${jobId}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.API_KEY}`
    //   }
    // });
    
    // if (!response.ok) {
    //   return NextResponse.json(
    //     { error: 'Backend API request failed' },
    //     { status: response.status }
    //   );
    // }
    
    // const data = await response.json();
    
    // Mock a successful response based on time
    const now = Date.now();
    const jobCreatedAt = parseInt(jobId.split('-')[1]);
    const elapsedMs = now - jobCreatedAt;
    
    let status = 'pending';
    let result = undefined;
    let completedAt = undefined;
    
    if (elapsedMs > 10000) {
      status = 'completed';
      completedAt = new Date().toISOString();
      
      // Sample customized resume
      result = `
JOHN DOE
Senior Software Engineer
john.doe@example.com | (123) 456-7890

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years specializing in scalable web applications using JavaScript/TypeScript, React, and Node.js. Proven track record in implementing CI/CD pipelines, microservices architecture, and optimizing application performance. Passionate about clean, maintainable code and mentoring junior developers.

EXPERIENCE
Senior Software Engineer | Tech Company ABC
January 2020 - Present
• Architected and implemented microservices that improved system reliability by 35%, focusing on high-performance, reusable code
• Established CI/CD pipelines that reduced deployment time by 40%, demonstrating expertise in DevOps practices
• Identified and resolved performance bottlenecks across the application stack
• Mentored junior engineers and conducted code reviews, fostering best practices and code quality

Software Engineer | Startup XYZ
June 2017 - December 2019
• Developed a real-time analytics dashboard using React, enhancing the frontend user experience
• Built RESTful APIs with Node.js to support frontend functionality
• Optimized SQL and NoSQL database queries that improved application performance by 25%
• Collaborated with cross-functional teams to define, design, and ship new features

EDUCATION
Master of Science in Computer Science
University of Technology, 2017

Bachelor of Science in Computer Engineering
State University, 2015

TECHNICAL SKILLS
• Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, Angular, HTML, CSS
• Backend: Node.js, Express, RESTful APIs, Django, Spring Boot
• Database: PostgreSQL, MongoDB, Redis, SQL/NoSQL systems
• Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD pipelines
`;
    } else if (elapsedMs > 5000) {
      status = 'processing';
    }
    
    return NextResponse.json({
      status: 'success',
      data: {
        jobId,
        status,
        result,
        createdAt: new Date(jobCreatedAt).toISOString(),
        completedAt
      }
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}