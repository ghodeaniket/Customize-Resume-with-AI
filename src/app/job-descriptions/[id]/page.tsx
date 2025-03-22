'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function JobDescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  
  // Mock data that would be fetched in a real application
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

  // Mock resume matches that would be fetched in a real application
  const mockResumeMatches = [
    { id: '1', title: 'Software Engineer Resume', matchScore: 83 },
    { id: '2', title: 'Full Stack Developer Resume', matchScore: 76 },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{mockJobDescription.title}</h1>
            <p className="text-xl text-gray-600">{mockJobDescription.company}</p>
          </div>
          <div className="space-x-2">
            <Link 
              href="/job-descriptions"
              className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Jobs
            </Link>
            <Link
              href={`/job-descriptions/${id}/match`}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Match with Resume
            </Link>
          </div>
        </div>
        <div className="flex mt-2 text-sm">
          <p className="text-gray-500 mr-4">
            Added on {new Date(mockJobDescription.createdAt).toLocaleDateString()}
          </p>
          {mockJobDescription.sourceUrl && (
            <a 
              href={mockJobDescription.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Source Link
            </a>
          )}
        </div>
      </div>
      
      <div className="flex space-x-1 border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === 'details' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Job Details
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'analysis' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'matches' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('matches')}
        >
          Resume Matches
        </button>
      </div>
      
      {activeTab === 'details' && (
        <div className="border rounded-lg p-6 bg-white whitespace-pre-line">
          {mockJobDescription.content}
        </div>
      )}
      
      {activeTab === 'analysis' && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">AI Job Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Key Skills</h3>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex flex-wrap gap-2">
                  {mockJobDescription.analyzedData.keySkills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Soft Skills</h3>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex flex-wrap gap-2">
                  {mockJobDescription.analyzedData.softSkills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Key Responsibilities</h3>
              <div className="p-3 bg-gray-50 rounded">
                <ul className="list-disc pl-5 space-y-1">
                  {mockJobDescription.analyzedData.keyResponsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Requirements</h3>
              <div className="p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 text-sm">Experience:</span>
                    <p>{mockJobDescription.analyzedData.requiredExperience}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Education:</span>
                    <p>{mockJobDescription.analyzedData.educationLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Job Type:</span>
                    <p>{mockJobDescription.analyzedData.jobType}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-2">Benefits</h3>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex flex-wrap gap-2">
                  {mockJobDescription.analyzedData.employmentBenefits.map((benefit, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'matches' && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Matching Resumes</h2>
          
          {mockResumeMatches.length > 0 ? (
            <div className="space-y-4">
              {mockResumeMatches.map((resume) => (
                <div key={resume.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{resume.title}</h3>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ 
                          backgroundColor: resume.matchScore >= 80 
                            ? '#22c55e' 
                            : resume.matchScore >= 60 
                            ? '#f59e0b' 
                            : '#ef4444'
                        }}
                      >
                        {resume.matchScore}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/customize?resumeId=${resume.id}&jobId=${id}`}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Customize Resume
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No matching resumes yet.</p>
              <Link
                href="/resumes"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload Resume
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}