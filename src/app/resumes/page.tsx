'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResumesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // This would be replaced with actual data fetching in a production app
  const mockResumes = [
    { id: '1', title: 'Software Engineer Resume', createdAt: '2024-03-20T10:00:00Z' },
    { id: '2', title: 'Product Manager Resume', createdAt: '2024-03-15T14:30:00Z' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is PDF or DOCX
      const fileType = selectedFile.type;
      if (
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setFile(selectedFile);
        setError(null);
        
        // Auto-set title from filename if not already set
        if (!resumeTitle) {
          const fileName = selectedFile.name.split('.')[0];
          setResumeTitle(fileName);
        }
      } else {
        setError('Please upload a PDF or DOCX file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!resumeTitle.trim()) {
      setError('Please enter a title for your resume');
      return;
    }
    
    setIsUploading(true);
    
    // In a real implementation, we would upload the file to a server
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsUploading(false);
      router.push('/resumes/1'); // Redirect to a mock resume detail page
    }, 2000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Resumes</h1>
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
            <h2 className="text-xl font-semibold mb-4">Upload New Resume</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Software Engineer Resume"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload File (PDF or DOCX)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="w-full p-2 border rounded-md"
                  required
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="col-span-1">
          <div className="border rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Recent Resumes</h2>
            {mockResumes.length > 0 ? (
              <ul className="space-y-3">
                {mockResumes.map((resume) => (
                  <li key={resume.id} className="border-b pb-2 last:border-b-0">
                    <Link 
                      href={`/resumes/${resume.id}`}
                      className="block hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <p className="font-medium">{resume.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No resumes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}