'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface PhotoUploadProps {
  value?: string;
  onChange: (photoUrl: string) => void;
  label?: string;
  className?: string;
}

export default function PhotoUpload({ value, onChange, label = "Profile Photo", className = "" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      // Upload to our API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        onChange(data.url);
        toast.success('Photo uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label} {label.includes('Optional') ? '' : '(Optional)'}
      </label>
      
      <div className="flex items-start space-x-4">
        {/* Preview Area */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt="Profile preview"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-600"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={handleClick}
              className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors bg-black/20"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs text-gray-400 mt-1">Add Photo</span>
            </div>
          )}
        </div>

        {/* Upload Button & Info */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose Photo
              </>
            )}
          </button>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>• JPEG, PNG, WebP formats supported</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Professional photos help build trust</p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
} 