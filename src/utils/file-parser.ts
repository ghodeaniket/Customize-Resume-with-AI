import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Parse different file types to extract text content
 */
export const parseResumeFile = async (file: File): Promise<{ 
  textContent: string;
  fileType: string;
}> => {
  const fileType = file.type;
  let textContent = '';
  
  try {
    if (fileType === 'application/pdf') {
      textContent = await parsePDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      textContent = await parseDocx(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }
    
    return { textContent, fileType };
  } catch (error) {
    console.error('Error parsing resume file:', error);
    throw error;
  }
};

/**
 * Parse PDF file to extract text
 */
const parsePDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Failed to read PDF file');
        }
        
        const arrayBuffer = event.target.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const pdfData = await pdfParse(uint8Array);
        resolve(pdfData.text);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse DOCX file to extract text
 */
const parseDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Failed to read DOCX file');
        }
        
        const arrayBuffer = event.target.result as ArrayBuffer;
        
        const result = await mammoth.extractRawText({
          arrayBuffer
        });
        
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Basic parsing of resume text to extract structured data
 * Note: In a real implementation, this would be more sophisticated
 * using NLP or a specialized resume parser
 */
export const extractResumeData = (text: string): any => {
  // This is a very simplified version for the MVP
  // A real implementation would use more sophisticated techniques
  
  // Extract basic contact info (very naive approach)
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  const contactInfo = {
    name: lines[0] || '',
    title: lines[1] || '',
    email: lines.find(line => line.includes('@')) || '',
    phone: lines.find(line => line.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)) || ''
  };
  
  // Find experience section (naive approach)
  const experienceStartIndex = lines.findIndex(line => 
    /experience|work|employment/i.test(line)
  );
  
  // Find education section (naive approach)
  const educationStartIndex = lines.findIndex(line => 
    /education|university|college|degree/i.test(line)
  );
  
  // Find skills section (naive approach)
  const skillsStartIndex = lines.findIndex(line => 
    /skills|technologies|tools|languages/i.test(line)
  );
  
  // Extract experience
  let experience: any[] = [];
  if (experienceStartIndex >= 0) {
    const endIndex = educationStartIndex > experienceStartIndex 
      ? educationStartIndex 
      : skillsStartIndex > experienceStartIndex 
        ? skillsStartIndex 
        : lines.length;
    
    const experienceLines = lines.slice(experienceStartIndex + 1, endIndex);
    let currentJob: any = {};
    let currentHighlights: string[] = [];
    
    experienceLines.forEach(line => {
      if (line.includes('|')) {
        // Save previous job if it exists
        if (currentJob.title) {
          currentJob.highlights = currentHighlights;
          experience.push(currentJob);
          currentHighlights = [];
        }
        
        // New job
        const parts = line.split('|').map(part => part.trim());
        currentJob = {
          title: parts[0],
          company: parts[1] || '',
          dates: experienceLines.find(l => l.includes('-')) || ''
        };
      } else if (line.startsWith('•')) {
        // Bullet points under the current job
        currentHighlights.push(line.replace('•', '').trim());
      }
    });
    
    // Add the last job
    if (currentJob.title) {
      currentJob.highlights = currentHighlights;
      experience.push(currentJob);
    }
  }
  
  // Extract education
  let education: any[] = [];
  if (educationStartIndex >= 0) {
    const endIndex = skillsStartIndex > educationStartIndex 
      ? skillsStartIndex 
      : experienceStartIndex > educationStartIndex 
        ? experienceStartIndex 
        : lines.length;
    
    const educationLines = lines.slice(educationStartIndex + 1, endIndex);
    
    let currentDegree = '';
    let currentInstitution = '';
    let currentYear = '';
    
    educationLines.forEach((line, index) => {
      if (index % 2 === 0) {
        currentDegree = line;
      } else {
        const parts = line.split(',').map(part => part.trim());
        currentInstitution = parts[0];
        currentYear = parts[1] || '';
        
        education.push({
          degree: currentDegree,
          institution: currentInstitution,
          year: currentYear
        });
      }
    });
  }
  
  // Extract skills
  let skills: string[] = [];
  if (skillsStartIndex >= 0) {
    const skillsLines = lines.slice(skillsStartIndex + 1);
    
    skillsLines.forEach(line => {
      if (line.startsWith('•')) {
        skills.push(line.replace('•', '').trim());
      }
    });
  }
  
  return {
    contact: contactInfo,
    experience,
    education,
    skills
  };
};
