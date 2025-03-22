'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JobDescriptionsPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Mock job descriptions that would be fetched in a real application
  const mockJobDescriptions = [
    { 
      id: '1', 
      title: 'Senior Software Engineer', 
      company: 'Enterprise Corp', 
      createdAt: '2024-03-21T10:00:00Z' 
    },
    { 
      id: '2', 
      title: 'Full Stack Developer', 
      company: 'Tech Startup', 
      createdAt: '2024-03-18T14:30:00Z' 
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    
    setIsAnalyzing(true);
    
    // In a real implementation, we would send this to a server for analysis
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsAnalyzing(false);
      router.push('/job-descriptions/1'); // Redirect to a mock job detail page
    }, 2000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Descriptions</h1>
        <Link 
          href="/"
          className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Add New Job Description</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., https://example.com/job-posting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[200px]"
                  placeholder="Paste the job description here..."
                  required
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isAnalyzing || !jobTitle.trim() || !jobDescription.trim()}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Job Description'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="col-span-1">
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Recent Job Descriptions</h2>
            
            {mockJobDescriptions.length > 0 ? (
              <ul className="space-y-3">
                {mockJobDescriptions.map((job) => (
                  <li key={job.id} className="border-b pb-2 last:border-b-0">
                    <Link 
                      href={`/job-descriptions/${job.id}`}
                      className="block hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No job descriptions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}