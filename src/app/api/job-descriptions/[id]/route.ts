import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // In a real implementation, this would fetch the job description from the database
    // For the MVP, we'll return mock data
    
    // Mock job description data
    const mockJobDescription = {
      id,
      title: 'Senior Software Engineer',
      company: 'Enterprise Corp',
      createdAt: '2024-03-21T10:00:00Z',
      sourceUrl: 'https://example.com/job-posting',
      content: `
Enterprise Corp is seeking a Senior Software Engineer to join our growing team. The ideal candidate will have experience building scalable web applications and a passion for clean, maintainable code.

Responsibilities:
• Design, develop, and maintain high-performance, reusable, and reliable code
• Collaborate with cross-functional teams to define, design, and ship new features
• Identify and correct bottlenecks and fix bugs
• Help maintain code quality, organization, and automatization
• Participate in code reviews and mentor junior developers

Requirements:
• 5+ years of experience in software development
• Strong proficiency in JavaScript/TypeScript and one or more frontend frameworks (React, Vue, Angular)
• Experience with Node.js and RESTful APIs
• Knowledge of database systems (SQL, NoSQL)
• Familiarity with CI/CD pipelines and DevOps practices
• Experience with cloud platforms (AWS, GCP, or Azure)
• Bachelor's degree in Computer Science or related field (or equivalent experience)

Benefits:
• Competitive salary and equity package
• Health, dental, and vision insurance
• 401(k) matching
• Flexible work arrangements
• Professional development budget
• Paid time off and holidays
`,
      analyzedData: {
        keySkills: [
          'JavaScript/TypeScript',
          'React/Vue/Angular',
          'Node.js',
          'RESTful APIs',
          'SQL/NoSQL',
          'CI/CD',
          'Cloud Platforms (AWS/GCP/Azure)'
        ],
        requiredExperience: '5+ years',
        educationLevel: "Bachelor's degree in Computer Science",
        jobType: 'Full-time',
        keyResponsibilities: [
          'Design and develop applications',
          'Collaborate with cross-functional teams',
          'Fix bugs and improve performance',
          'Maintain code quality',
          'Code reviews and mentoring'
        ],
        employmentBenefits: [
          'Competitive salary and equity',
          'Health insurance',
          'Retirement benefits',
          'Flexible work',
          'Professional development',
          'PTO'
        ],
        softSkills: [
          'Collaboration',
          'Mentoring',
          'Communication'
        ]
      }
    };
    
    return NextResponse.json(mockJobDescription);
  } catch (error) {
    console.error('Error fetching job description:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job description' },
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
    
    // In a real implementation, this would delete the job description from the database
    // For the MVP, we'll just return a success message
    
    return NextResponse.json({
      message: `Job description with ID ${id} successfully deleted`
    });
  } catch (error) {
    console.error('Error deleting job description:', error);
    return NextResponse.json(
      { error: 'Failed to delete job description' },
      { status: 500 }
    );
  }
}