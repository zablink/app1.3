// components/admin/ImageUploadZone.tsx
'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

interface ImageUploadZoneProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxSize?: number; // in MB
  label?: string;
  disabled?: boolean;
  // Compression options
  maxWidth?: number; // max width in pixels (default: 1920)
  maxHeight?: number; // max height in pixels (default: 1920)
  quality?: number; // compression quality 0.0-1.0 (default: 0.85)
  enableCompression?: boolean; // enable/disable compression (default: true)
  preserveFormat?: boolean; // preserve original format (true for logos/icons, no jpg conversion)
}

export default function ImageUploadZone({
  value,
  onChange,
  folder = 'banners',
  maxSize = 5,
  label = 'รูปภาพ',
  disabled = false,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85,
  enableCompression = true,
  preserveFormat = false
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setCompressionInfo(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setError(`ขนาดไฟล์ต้องไม่เกิน ${maxSize}MB`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let fileToUpload = file;
      
      // Compress image if enabled (skip for SVG and if preserveFormat is true)
      if (enableCompression && !preserveFormat && file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        setUploadProgress(10);
        const compressed = await compressImage(file, {
          maxWidth,
          maxHeight,
          quality,
          mimeType: 'image/jpeg'
        });
        
        fileToUpload = compressed.file;
        const savedPercent = compressed.compressionRatio.toFixed(1);
        setCompressionInfo(
          `ลดขนาดจาก ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.compressedSize)} (ประหยัด ${savedPercent}%)`
        );
      }

      setUploadProgress(30);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', folder);
      if (preserveFormat) {
        formData.append('preserveFormat', 'true');
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        setUploadProgress(100);
        onChange(data.url);
        
        // Reset progress after a short delay
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} *
      </label>

      {/* Image Preview */}
      {value && !isUploading && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full max-h-64 rounded-lg border-2 border-gray-300 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            <p className="text-sm text-gray-600">กำลังอัปโหลด...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload className={`mx-auto w-12 h-12 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className="mt-2 text-sm text-gray-600">
              {isDragging ? (
                <span className="font-medium text-orange-600">วางไฟล์ที่นี่...</span>
              ) : (
                <>
                  <span className="font-medium text-orange-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              รองรับ: PNG, JPG, GIF, WebP (สูงสุด {maxSize}MB)
            </p>
          </>
        )}
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="หรือใส่ URL รูปภาพ"
          disabled={disabled || isUploading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Compression Info */}
      {compressionInfo && !error && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{compressionInfo}</span>
        </div>
      )}

      {/* Success Message */}
      {value && !isUploading && !error && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>อัปโหลดสำเร็จ</span>
        </div>
      )}
    </div>
  );
}
