// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  textContent?: string;
  parsedData?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  content?: string;
  sourceUrl?: string;
  analyzedData?: {
    keySkills: string[];
    requirements?: string[];
    niceToHave?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Customization {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  customizedContent: string;
  originalContent?: string;
  createdAt: string;
  metrics?: {
    keywordMatches?: number;
    improvementScore?: number;
    readabilityScore?: number;
    [key: string]: any;
  };
}

export interface CustomizationSettings {
  tailoringLevel?: 'light' | 'moderate' | 'significant';
  focusAreas?: string[];
  preserveFormatting?: boolean;
  highlightChanges?: boolean;
  [key: string]: any;
}

export interface CustomizationJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Customization;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
