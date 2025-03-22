'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('preview');
  
  // Mock data that would be fetched in a real application
  const mockResume = {
    id,
    title: 'Software Engineer Resume',
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

  // Mock job matches that would be fetched in a real application
  const mockJobMatches = [
    { id: '1', title: 'Senior Software Engineer', company: 'Enterprise Corp', matchScore: 87 },
    { id: '2', title: 'Full Stack Developer', company: 'Tech Startup', matchScore: 74 },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{mockResume.title}</h1>
          <div className="space-x-2">
            <Link 
              href="/resumes"
              className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Resumes
            </Link>
            <Link
              href={`/resumes/${id}/customize`}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Customize for Job
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Uploaded on {new Date(mockResume.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex space-x-1 border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === 'preview' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'parsed' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('parsed')}
        >
          Parsed Data
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'matches' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('matches')}
        >
          Job Matches
        </button>
      </div>
      
      {activeTab === 'preview' && (
        <div className="border rounded-lg p-6 bg-white whitespace-pre-line font-mono">
          {mockResume.textContent}
        </div>
      )}
      
      {activeTab === 'parsed' && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Parsed Resume Data</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-500 text-sm">Name:</span>
                  <p>{mockResume.parsedData.contact.name}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-500 text-sm">Title:</span>
                  <p>{mockResume.parsedData.contact.title}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-500 text-sm">Email:</span>
                  <p>{mockResume.parsedData.contact.email}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <p>{mockResume.parsedData.contact.phone}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Experience</h3>
              <div className="space-y-4">
                {mockResume.parsedData.experience.map((exp, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-gray-500">{exp.dates}</p>
                    </div>
                    <p className="text-gray-600">{exp.company}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {exp.highlights.map((item, i) => (
                        <li key={i} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Education</h3>
              <div className="space-y-2">
                {mockResume.parsedData.education.map((edu, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{edu.degree}</p>
                    <div className="flex justify-between">
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-gray-500">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Skills</h3>
              <div className="p-3 bg-gray-50 rounded">
                <ul className="list-disc pl-5 space-y-1">
                  {mockResume.parsedData.skills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'matches' && (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Matching Job Descriptions</h2>
          
          {mockJobMatches.length > 0 ? (
            <div className="space-y-4">
              {mockJobMatches.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ 
                          backgroundColor: job.matchScore >= 80 
                            ? '#22c55e' 
                            : job.matchScore >= 60 
                            ? '#f59e0b' 
                            : '#ef4444'
                        }}
                      >
                        {job.matchScore}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/resumes/${id}/customize?jobId=${job.id}`}
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
              <p className="text-gray-500 mb-4">No job matches yet.</p>
              <Link
                href="/job-descriptions/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Job Description
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}