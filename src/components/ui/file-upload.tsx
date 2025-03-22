'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  acceptedFileTypes: string[];
  maxSize?: number;
  onFileSelect: (file: File) => void;
  label?: string;
}

export default function FileUpload({
  acceptedFileTypes,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  label = 'Upload a file'
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const { errors } = rejectedFiles[0];
      
      if (errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
      } else if (errors[0]?.code === 'file-invalid-type') {
        setError(`Invalid file type. Please upload ${acceptedFileTypes.join(' or ')}`);
      } else {
        setError('Error uploading file. Please try again.');
      }
      
      setSelectedFile(null);
      return;
    }
    
    // Handle accepted files
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError(null);
      onFileSelect(file);
    }
  }, [maxSize, acceptedFileTypes, onFileSelect]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false
  });
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <svg
            className={`w-10 h-10 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          {selectedFile ? (
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-gray-500">
                {isDragActive
                  ? 'Drop the file here'
                  : `Drag & drop or click to browse. Max size: ${maxSize / (1024 * 1024)}MB`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Accepted file types: {acceptedFileTypes.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}