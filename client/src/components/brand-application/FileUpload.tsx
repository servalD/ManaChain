"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import PinataService from "@/services/pinata.service";
import FormCacheService from "@/services/form-cache.service";
import { toast, confirmToast } from "@/lib/toast";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  fieldName?: string; // For tracking file metadata
  onUploadStart?: () => void;
  onUploadComplete?: (url: string) => void;
  /**
   * Overrides the default Pinata/IPFS upload — used for fields backed by a
   * different storage (e.g. the registration proof, stored server-side, not
   * on IPFS). `value` becomes whatever opaque identifier the override returns.
   */
  uploadOverride?: (file: File) => Promise<string>;
  /** Overrides the default Pinata unpin call, paired with `uploadOverride`. */
  removeOverride?: (value: string) => Promise<void>;
  /**
   * Skips the URL-based image/PDF sniffing (irrelevant once `value` is an
   * opaque ID rather than a URL) and always renders the PDF preview.
   */
  forcePdfPreview?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept,
  label,
  description,
  required = false,
  error,
  fieldName = "",
  onUploadStart,
  onUploadComplete,
  uploadOverride,
  removeOverride,
  forcePdfPreview = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentIpfsHash, setCurrentIpfsHash] = useState<string | null>(null);
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
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      if (uploadOverride) {
        const uploadId = await uploadOverride(file);
        onChange(uploadId);
        onUploadComplete?.(uploadId);
        return;
      }

      // Upload to Pinata IPFS
      const ipfsUrl = await PinataService.uploadFile(file);

      // Extract and store IPFS hash for later deletion
      const ipfsHash = PinataService.extractIpfsHash(ipfsUrl);
      setCurrentIpfsHash(ipfsHash);

      // Save file metadata to cache
      if (fieldName) {
        FormCacheService.saveFileMetadata(fieldName, ipfsHash, ipfsUrl);
      }

      // Update form with the IPFS URL
      onChange(ipfsUrl);
      onUploadComplete?.(ipfsUrl);

    } catch (error) {
      console.error('Error uploading file:', error);
      // Error toast is already shown by PinataService
    } finally {
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

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Show confirmation toast
    confirmToast({
      title: "Remove file?",
      description: "Are you sure you want to remove this file?",
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          if (removeOverride) {
            if (value) await removeOverride(value);
            onChange('');
            return;
          }

          // Try to delete from Pinata if we have the hash
          let hashToDelete = currentIpfsHash;

          // If not in state, try to get from cache
          if (!hashToDelete && fieldName) {
            hashToDelete = FormCacheService.getFileIpfsHash(fieldName);
          }

          // If still no hash, try to extract from the current value
          if (!hashToDelete && value) {
            hashToDelete = PinataService.extractIpfsHash(value);
          }

          // Delete from Pinata if we have a hash
          if (hashToDelete) {
            await PinataService.deleteFile(hashToDelete);

            // Remove from cache metadata
            if (fieldName) {
              FormCacheService.removeFileMetadata(fieldName);
            }

            toast({
              title: "File removed",
              description: "The file has been deleted",
              variant: "success",
            });
          }

          // Clear the value
          setCurrentIpfsHash(null);
          onChange('');
        } catch (error) {
          console.error('Error removing file:', error);
          // Still clear the value even if deletion failed
          setCurrentIpfsHash(null);
          onChange('');
        }
      },
      onCancel: () => {
        // User cancelled, do nothing
      },
    });
  };

  const isImage = !forcePdfPreview && value && (value.startsWith('data:image') || /\.(png|svg|jpeg|jpg)$/i.test(value));
  const isPdf = forcePdfPreview || (value && (value.startsWith('data:application/pdf') || value.endsWith('.pdf')));

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
                <div className="shrink-0">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                </div>
              ) : isPdf ? (
                <div className="shrink-0 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
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
                className="shrink-0 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
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
                <div className="w-full">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 px-2">
                    Accepted: <span className="break-all inline-block max-w-full">{accept}</span>
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
