'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Resume Customizer</h3>
            <p className="text-gray-600">
              Optimize your resume for each job application using AI. Stand out from the competition and land your dream job.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/resumes"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Resumes
                </Link>
              </li>
              <li>
                <Link
                  href="/job-descriptions"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Job Descriptions
                </Link>
              </li>
              <li>
                <Link
                  href="/customize"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Customize
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-600 mb-2">
              Have questions or need help?
            </p>
            <a
              href="mailto:support@resumecustomizer.com"
              className="text-blue-600 hover:underline"
            >
              support@resumecustomizer.com
            </a>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>© {currentYear} Resume Customizer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}