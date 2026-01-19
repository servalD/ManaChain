"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
}

export function FileUpload({
  value,
  onChange,
  accept,
  label,
  description,
  required = false,
  error,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file: File): string | null => {
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    for (const acceptedType of acceptedTypes) {
      if (acceptedType.startsWith('.')) {
        if (fileExtension === acceptedType.substring(1)) {
          return null; // Valid
        }
      } else if (acceptedType.includes('/')) {
        if (file.type === acceptedType) {
          return null; // Valid
        }
      }
    }
    
    return `Invalid file type. Accepted formats: ${accept}`;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert file to data URL for now (mock implementation)
      // In production, you would upload to a server and get a URL back
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file:', error);
      alert('Error processing file');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const isImage = value && (value.startsWith('data:image') || /\.(png|svg|jpeg|jpg)$/i.test(value));
  const isPdf = value && (value.startsWith('data:application/pdf') || value.endsWith('.pdf'));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer"
            onClick={handleClick}
          >
            <div className="flex items-center gap-4">
              {isImage ? (
                <div className="flex-shrink-0">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                </div>
              ) : isPdf ? (
                <div className="flex-shrink-0 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <File className="w-8 h-8 text-red-500" />
                </div>
              ) : null}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {isImage ? 'Image uploaded' : isPdf ? 'PDF uploaded' : 'File uploaded'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click to replace or drag a new file
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleRemove}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-violet-400 bg-violet-400/10 scale-[1.02]' 
              : 'border-border hover:border-violet-400/50 hover:bg-accent/10'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <>
                <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-violet-400/10 flex items-center justify-center">
                  {accept.includes('image') || accept.includes('png') || accept.includes('svg') || accept.includes('jpeg') ? (
                    <ImageIcon className="w-6 h-6 text-violet-400" />
                  ) : (
                    <Upload className="w-6 h-6 text-violet-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Accepted: {accept}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
