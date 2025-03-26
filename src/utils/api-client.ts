// src/utils/api-client.ts
import { JobDescription, Resume, Customization, CustomizationSettings } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * API client for interacting with the Resume Customizer backend
 */
export class ApiClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    // In a real app, this would come from auth context
    this.apiKey = apiKey || 'dev-test-key';
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
  }

  /**
   * Get headers for file upload requests
   */
  private getFileHeaders(): HeadersInit {
    return {
      'X-API-Key': this.apiKey,
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    console.error('API Error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data?.message || 'Server error');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'Request failed');
    }
  }

  /**
   * Upload a resume
   */
  async uploadResume(file: File, title: string): Promise<Resume> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const response = await fetch(`${API_BASE_URL}/resumes`, {
        method: 'POST',
        headers: this.getFileHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload resume');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all resumes for the current user
   */
  async getResumes(): Promise<Resume[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get resumes');
      }

      const data = await response.json();
      return data.data.resumes;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific resume by ID
   */
  async getResume(id: string): Promise<Resume> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get resume');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete resume');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a job description
   */
  async createJobDescription(jobDescription: {
    title: string;
    content: string;
    sourceUrl?: string;
  }): Promise<JobDescription> {
    try {
      const response = await fetch(`${API_BASE_URL}/job-descriptions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(jobDescription),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create job description');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all job descriptions for the current user
   */
  async getJobDescriptions(): Promise<JobDescription[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/job-descriptions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get job descriptions');
      }

      const data = await response.json();
      return data.data.jobDescriptions;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific job description by ID
   */
  async getJobDescription(id: string): Promise<JobDescription> {
    try {
      const response = await fetch(`${API_BASE_URL}/job-descriptions/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get job description');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a job description
   */
  async updateJobDescription(
    id: string,
    updates: {
      title: string;
      content: string;
      sourceUrl?: string;
    }
  ): Promise<JobDescription> {
    try {
      const response = await fetch(`${API_BASE_URL}/job-descriptions/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update job description');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a job description
   */
  async deleteJobDescription(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/job-descriptions/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete job description');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a customization by customizing a resume for a job description
   */
  async customizeResume(
    resumeId: string,
    jobDescriptionId: string,
    settings?: CustomizationSettings
  ): Promise<Customization> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume/customize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          resumeId,
          jobDescriptionId,
          customizationSettings: settings || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to customize resume');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get customization job status
   */
  async getCustomizationStatus(jobId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume/status/${jobId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get customization status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get customization history
   */
  async getCustomizationHistory(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume/history`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get customization history');
      }

      const data = await response.json();
      return data.data.jobs;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
