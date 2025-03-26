'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/utils/api-client';

export default function Home() {
  const [apiKey, setApiKey] = useState('demo-api-key-55902034-f169-4a9d-a4a1-c205a96ba56f');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizationFocus, setOptimizationFocus] = useState('default');
  const [templateStyle, setTemplateStyle] = useState('modern');
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [primaryColor, setPrimaryColor] = useState('#4c6ef5');
  const [debugMessages, setDebugMessages] = useState<{time: string, message: string}[]>([]);
  const [isResultView, setIsResultView] = useState(false);
  const [resultContent, setResultContent] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize debug console
  useEffect(() => {
    logToConsole('Ready to customize your resume...');
  }, []);

  // Poll for job status if we have a jobId
  useEffect(() => {
    if (jobId && isProcessing) {
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiClient.getCustomizationStatus(jobId);
          logToConsole(`Job status: ${status.status}`);
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setResultContent(status.result);
            setIsResultView(true);
            logToConsole('Customization complete!');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            logToConsole(`Job failed: ${status.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error polling job status:', error);
          logToConsole(`Error checking job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
          clearInterval(pollInterval);
          setIsProcessing(false);
        }
      }, 2000);
      
      return () => clearInterval(pollInterval);
    }
  }, [jobId, isProcessing]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Log message to debug console
  const logToConsole = (message: string) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    setDebugMessages(prev => [...prev, { time: timeString, message }]);
  };

  // Handle file change from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      logToConsole('File content loaded successfully');
    }
  };

  // Handle drag over for upload area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.borderColor = '#4c6ef5';
    }
  };

  // Handle drag leave for upload area
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.borderColor = '#ced4da';
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.borderColor = '#ced4da';
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      logToConsole('File content loaded successfully');
    }
  };

  // Load sample job description
  const loadSampleJobDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    const sampleDescription = `Senior Software Engineer

Company: Enterprise Tech Solutions
Location: Remote (US based)

About the role:
We are seeking a skilled Senior Software Engineer to join our growing team. The ideal candidate will have a strong background in building scalable applications and a passion for clean, maintainable code.

Responsibilities:
• Design, develop, and maintain high-performance, reusable, and reliable code
• Lead the development of new features and applications
• Collaborate with cross-functional teams to define, design, and ship new features
• Identify bottlenecks and bugs, and devise solutions to address and mitigate these issues
• Help maintain code quality, organization, and automatization
• Mentor junior software engineers and review their code

Requirements:
• 5+ years of experience in software development
• Strong proficiency in JavaScript/TypeScript and one or more frontend frameworks (React, Vue, Angular)
• Experience with Node.js and RESTful APIs
• Knowledge of database systems (SQL, NoSQL)
• Familiarity with CI/CD pipelines and DevOps practices
• Experience with cloud platforms (AWS, GCP, or Azure)
• Bachelor's degree in Computer Science or related field (or equivalent experience)`;
    setJobDescription(sampleDescription);
    logToConsole('Sample job description loaded');
  };

  // Handle file upload button click
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle customize button click
  const handleCustomizeClick = async () => {
    if (!selectedFile) {
      logToConsole('Error: Please upload a resume file');
      return;
    }
    
    if (!jobDescription) {
      logToConsole('Error: Please enter a job description');
      return;
    }
    
    logToConsole('Starting resume customization...');
    
    try {
      // Update the API key if changed
      apiClient.setApiKey(apiKey);
      
      setIsProcessing(true);
      logToConsole('Creating FormData for file upload...');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('resumeFormat', selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf');
      formData.append('outputFormat', outputFormat);
      formData.append('jobDescription', jobDescription);
      formData.append('isJobDescriptionUrl', 'false');
      formData.append('optimizationFocus', optimizationFocus);
      
      // Make API call to start customization
      logToConsole('Submitting API request to /resume/customize...');
      
      // Note: This would typically go through apiClient, but since we're using FormData directly
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const response = await fetch(`${API_BASE_URL}/resume/customize`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to customize resume');
      }
      
      const data = await response.json();
      const newJobId = data.data.jobId;
      
      logToConsole(`Request submitted successfully. Job ID: ${newJobId}`);
      setJobId(newJobId);
      
    } catch (error) {
      setIsProcessing(false);
      console.error('Error customizing resume:', error);
      logToConsole(`Error: ${error instanceof Error ? error.message : 'Failed to customize resume'}`);
    }
  };

  // Switch tabs in results view
  const switchTab = (tab: string) => {
    setActiveTab(tab);
  };

  // Copy content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultContent);
    alert('Copied to clipboard!');
  };

  // Return to form view
  const startNewCustomization = () => {
    setIsResultView(false);
    setResultContent('');
    setJobId(null);
  };

  // Convert markdown to HTML for preview
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)\n(<li>)/g, '$1$2')
      .replace(/(<li>.*<\/li>)\n(?![<\-])/g, '<ul>$1</ul>\n')
      .replace(/(<li>.*<\/li>)$/, '<ul>$1</ul>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Paragraphs
      .replace(/\n\n(?![<])/g, '<br><br>');
  };

  // Convert markdown to plain text
  const markdownToText = (markdown: string): string => {
    return markdown
      // Remove headers
      .replace(/^# (.*$)/gm, '$1')
      .replace(/^## (.*$)/gm, '$1')
      .replace(/^### (.*$)/gm, '$1')
      // Remove bold
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic
      .replace(/\*(.*?)\*/g, '$1')
      // Remove code blocks
      .replace(/```([\s\S]*?)```/g, '$1');
  };
  
  return (
    <div className="min-h-screen" style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      backgroundColor: '#f8f9fa',
      color: '#333',
      lineHeight: '1.6',
      padding: 0,
      margin: 0
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>Resume Customizer</h1>
        <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '30px' }}>Upload your resume and we'll tailor it for your target job</p>
        
        {!isResultView ? (
          <div id="form-page">
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="api-key" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>API Key</label>
                <input 
                  type="text" 
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '1rem'
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '5px' }}>Demo key is pre-filled for testing</p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Resume (PDF format)</label>
                <div 
                  id="upload-area"
                  style={{
                    border: '2px dashed #ced4da',
                    borderRadius: '4px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    transition: 'border-color 0.3s'
                  }}
                  onClick={handleUploadButtonClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div style={{
                    display: 'block',
                    width: '50px',
                    height: '50px',
                    margin: '0 auto 15px',
                    backgroundColor: '#99b4d1',
                    borderRadius: '8px',
                    position: 'relative'
                  }}>
                    <span style={{
                      content: '',
                      position: 'absolute',
                      top: '15px',
                      left: '18px',
                      width: '14px',
                      height: '20px',
                      border: 'solid white',
                      borderWidth: '0 3px 3px 0',
                      transform: 'rotate(-135deg)'
                    }}></span>
                  </div>
                  <p style={{ marginBottom: '10px' }}>Upload a file or drag and drop</p>
                  <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>PDF up to 10MB</p>
                </div>
                <div 
                  style={{
                    display: 'inline-block',
                    padding: '8px 15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onClick={handleUploadButtonClick}
                >
                  Upload a file
                </div>
                <input 
                  type="file" 
                  id="file-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                  style={{ display: 'none' }}
                />
                <div style={{ fontStyle: 'italic', marginBottom: '10px' }}>
                  {selectedFile && `Selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="job-description" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Job Description</label>
                <textarea 
                  id="job-description"
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '1rem'
                  }}
                ></textarea>
                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                  <a href="#" onClick={loadSampleJobDescription}>Load sample job description</a>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="optimization" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Optimization Focus</label>
                    <select 
                      id="optimization"
                      value={optimizationFocus}
                      onChange={(e) => setOptimizationFocus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="default">Balanced (Default)</option>
                      <option value="ats">ATS Optimization</option>
                      <option value="human">Human Recruiter</option>
                      <option value="technical">Technical Focus</option>
                    </select>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '5px' }}>All-around optimization for general applications</p>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="template" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Template Style</label>
                    <select 
                      id="template"
                      value={templateStyle}
                      onChange={(e) => setTemplateStyle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="format" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Output Format</label>
                    <select 
                      id="format"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                      <option value="markdown">Markdown</option>
                      <option value="text">Plain Text</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="color" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Primary Color</label>
                    <input 
                      type="color"
                      id="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        height: '40px',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                id="customize-btn"
                onClick={handleCustomizeClick}
                disabled={isProcessing}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: isProcessing ? '#a0aec0' : '#4c6ef5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                {isProcessing ? 'Processing...' : 'Customize Resume'}
              </button>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
              <h3>Debug Console</h3>
              <div style={{
                backgroundColor: '#212529',
                color: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                overflowY: 'auto',
                height: '200px'
              }}>
                {debugMessages.map((entry, index) => (
                  <div key={index} style={{ margin: '5px 0' }}>
                    <span style={{ color: '#adb5bd' }}>[{entry.time}]</span> {entry.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div id="result-page" style={{ padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '30px' }}>
              <h2>Your Customized Resume</h2>
              <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
                <div 
                  className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => switchTab('preview')}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'preview' ? '2px solid #4c6ef5' : '2px solid transparent',
                    fontWeight: activeTab === 'preview' ? 'bold' : 'normal'
                  }}
                >
                  Preview
                </div>
                <div 
                  className={`tab ${activeTab === 'markdown' ? 'active' : ''}`}
                  onClick={() => switchTab('markdown')}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'markdown' ? '2px solid #4c6ef5' : '2px solid transparent',
                    fontWeight: activeTab === 'markdown' ? 'bold' : 'normal'
                  }}
                >
                  Markdown
                </div>
                <div 
                  className={`tab ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => switchTab('text')}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'text' ? '2px solid #4c6ef5' : '2px solid transparent',
                    fontWeight: activeTab === 'text' ? 'bold' : 'normal'
                  }}
                >
                  Plain Text
                </div>
              </div>
              
              <div 
                id="preview-content" 
                style={{
                  display: activeTab === 'preview' ? 'block' : 'none',
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(resultContent) }}
              ></div>
              
              <div 
                id="markdown-content"
                style={{
                  display: activeTab === 'markdown' ? 'block' : 'none',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              >
                {resultContent}
              </div>
              
              <div 
                id="text-content"
                style={{
                  display: activeTab === 'text' ? 'block' : 'none',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              >
                {markdownToText(resultContent)}
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  id="copy-btn"
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ced4da',
                    color: '#212529'
                  }}
                >
                  Copy to Clipboard
                </button>
                <button 
                  id="download-btn"
                  style={{
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: '#4c6ef5',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Download
                </button>
                <button 
                  id="new-btn"
                  onClick={startNewCustomization}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: '#40c057',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  New Customization
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}