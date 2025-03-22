import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // In a real implementation, this would fetch the resume from the database
    // For the MVP, we'll return mock data
    
    // Mock resume data
    const mockResume = {
      id,
      title: 'Software Engineer Resume',
      fileName: 'resume.pdf',
      fileType: 'application/pdf',
      fileSize: 245000,
      createdAt: '2024-03-20T10:00:00Z',
      textContent: `
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890

EXPERIENCE
Senior Software Engineer | Tech Company ABC
January 2020 - Present
• Led the development of a microservices architecture that improved system reliability by 35%
• Implemented CI/CD pipelines that reduced deployment time by 40%
• Mentored junior engineers and conducted code reviews

Software Engineer | Startup XYZ
June 2017 - December 2019
• Built a real-time analytics dashboard using React and Node.js
• Optimized database queries that improved application performance by 25%
• Collaborated with product teams to implement new features

EDUCATION
Master of Science in Computer Science
University of Technology, 2017

Bachelor of Science in Computer Engineering
State University, 2015

SKILLS
• Programming: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, HTML, CSS
• Backend: Node.js, Express, Django, Spring Boot
• Database: PostgreSQL, MongoDB, Redis
• DevOps: Docker, Kubernetes, AWS, CI/CD
`,
      parsedData: {
        contact: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '(123) 456-7890',
          title: 'Software Engineer'
        },
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Company ABC',
            dates: 'January 2020 - Present',
            highlights: [
              'Led the development of a microservices architecture that improved system reliability by 35%',
              'Implemented CI/CD pipelines that reduced deployment time by 40%',
              'Mentored junior engineers and conducted code reviews'
            ]
          },
          {
            title: 'Software Engineer',
            company: 'Startup XYZ',
            dates: 'June 2017 - December 2019',
            highlights: [
              'Built a real-time analytics dashboard using React and Node.js',
              'Optimized database queries that improved application performance by 25%',
              'Collaborated with product teams to implement new features'
            ]
          }
        ],
        education: [
          {
            degree: 'Master of Science in Computer Science',
            institution: 'University of Technology',
            year: '2017'
          },
          {
            degree: 'Bachelor of Science in Computer Engineering',
            institution: 'State University',
            year: '2015'
          }
        ],
        skills: [
          'Programming: JavaScript, TypeScript, Python, Java',
          'Frontend: React, Vue.js, HTML, CSS',
          'Backend: Node.js, Express, Django, Spring Boot',
          'Database: PostgreSQL, MongoDB, Redis',
          'DevOps: Docker, Kubernetes, AWS, CI/CD'
        ]
      }
    };
    
    return NextResponse.json(mockResume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // In a real implementation, this would delete the resume from the database
    // For the MVP, we'll just return a success message
    
    return NextResponse.json({
      message: `Resume with ID ${id} successfully deleted`
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}