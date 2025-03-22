'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomizePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get('resumeId');
  const jobId = searchParams.get('jobId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState<any>(null);
  const [customizedContent, setCustomizedContent] = useState<string>('');
  const [customizationSettings, setCustomizationSettings] = useState({
    highlightKeywords: true,
    reorganizeContent: true,
    addKeySkills: true,
    improveLanguage: true,
    customizationLevel: 'moderate' // 'light', 'moderate', 'substantial'
  });
  
  // Mock initial data load
  useEffect(() => {
    if (!resumeId || !jobId) {
      // Redirect to home if params are missing
      router.push('/');
      return;
    }
    
    // Simulate fetching resume and job data
    setTimeout(() => {
      // Mock resume data
      setResume({
        id: resumeId,
        title: 'Software Engineer Resume',
        content: `
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
`
      });
      
      // Mock job description data
      setJobDescription({
        id: jobId,
        title: 'Senior Software Engineer',
        company: 'Enterprise Corp',
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
          ]
        }
      });
      
      setIsLoading(false);
    }, 1000);
  }, [resumeId, jobId, router]);
  
  const handleCustomize = () => {
    setIsCustomizing(true);
    
    // Simulate AI customization process
    setTimeout(() => {
      // This would be replaced with actual AI-generated content
      const customized = `
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
      
      setCustomizedContent(customized);
      setIsCustomizing(false);
    }, 3000);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Resume Customization</h1>
          <Link 
            href="/"
            className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Customizing <span className="font-medium">{resume?.title}</span> for{' '}
          <span className="font-medium">{jobDescription?.title}</span> at{' '}
          <span className="font-medium">{jobDescription?.company}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Original Resume */}
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Original Resume</h2>
          </div>
          <div className="p-4 whitespace-pre-line font-mono text-sm h-[600px] overflow-y-auto">
            {resume?.content}
          </div>
        </div>
        
        {/* Customization Settings */}
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Customization Settings</h2>
          </div>
          <div className="p-4">
            <div className="mb-6">
              <h3 className="font-medium mb-2">Customization Level</h3>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'moderate', 'substantial'].map((level) => (
                  <button
                    key={level}
                    className={`p-2 rounded-md border text-center capitalize ${
                      customizationSettings.customizationLevel === level
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setCustomizationSettings({
                      ...customizationSettings,
                      customizationLevel: level
                    })}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {customizationSettings.customizationLevel === 'light' && 'Minor tweaks to match keywords and phrases.'}
                {customizationSettings.customizationLevel === 'moderate' && 'Balanced approach with targeted changes and restructuring.'}
                {customizationSettings.customizationLevel === 'substantial' && 'Comprehensive rewrite to maximize relevance to the job.'}
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <h3 className="font-medium mb-2">Optimization Options</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="highlightKeywords"
                  checked={customizationSettings.highlightKeywords}
                  onChange={(e) => setCustomizationSettings({
                    ...customizationSettings,
                    highlightKeywords: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="highlightKeywords">
                  Highlight keywords from job description
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reorganizeContent"
                  checked={customizationSettings.reorganizeContent}
                  onChange={(e) => setCustomizationSettings({
                    ...customizationSettings,
                    reorganizeContent: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="reorganizeContent">
                  Reorganize content to prioritize relevant experience
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="addKeySkills"
                  checked={customizationSettings.addKeySkills}
                  onChange={(e) => setCustomizationSettings({
                    ...customizationSettings,
                    addKeySkills: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="addKeySkills">
                  Add missing key skills (if applicable)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="improveLanguage"
                  checked={customizationSettings.improveLanguage}
                  onChange={(e) => setCustomizationSettings({
                    ...customizationSettings,
                    improveLanguage: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="improveLanguage">
                  Improve language and bullet point structure
                </label>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md mb-6">
              <h3 className="font-medium mb-2">Key Skills to Emphasize</h3>
              <div className="flex flex-wrap gap-2">
                {jobDescription?.analyzedData.keySkills.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleCustomize}
              disabled={isCustomizing}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isCustomizing ? 'Customizing...' : 'Generate Customized Resume'}
            </button>
          </div>
        </div>
        
        {/* Customized Resume */}
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Customized Resume</h2>
          </div>
          <div className="p-4 whitespace-pre-line font-mono text-sm h-[600px] overflow-y-auto">
            {customizedContent ? (
              <>
                {customizedContent}
                <div className="mt-6 flex space-x-2 justify-center">
                  <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors">
                    Copy to Clipboard
                  </button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Download as PDF
                  </button>
                  <button className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                    Save Customization
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Customized content will appear here after generation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}