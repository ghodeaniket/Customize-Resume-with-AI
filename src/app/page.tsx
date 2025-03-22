export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-6">Resume Customizer</h1>
        <p className="text-xl mb-8">
          Optimize your resume for each job application using AI
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Upload Resume</h2>
            <p className="mb-4">
              Upload your resume and let our AI analyze it
            </p>
            <a 
              href="/resumes"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
          </div>
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Add Job Description</h2>
            <p className="mb-4">
              Paste a job description for analysis
            </p>
            <a 
              href="/job-descriptions"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Analyze Job
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}