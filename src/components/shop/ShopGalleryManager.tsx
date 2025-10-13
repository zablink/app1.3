// src/components/shop/ShopGalleryManager.tsx (Updated)

'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import type { ShopImage } from '@/types/shop';
import { uploadShopImage } from '@/lib/clientUploadHelper';
import { validateImageFile, formatFileSize } from '@/utils/imageCompression';

interface ShopGalleryManagerProps {
  shopId: string;
  gallery: ShopImage[];
  onImageUploaded: (url: string, isFeatured: boolean) => void;
  onRemoveImage: (imageId: string) => void;
  onSetFeatured: (imageId: string) => void;
}

export const ShopGalleryManager: React.FC<ShopGalleryManagerProps> = ({
  shopId,
  gallery,
  onImageUploaded,
  onRemoveImage,
  onSetFeatured,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('กำลังเตรียมอัปโหลด...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(
          `กำลังอัปโหลดรูปที่ ${i + 1}/${files.length} (${formatFileSize(file.size)})`
        );

        const result = await uploadShopImage(file, shopId, (progress) => {
          setUploadProgress(progress);
        });

        if (result.success && result.url) {
          // Auto-set first image as featured if no featured image exists
          const isFeatured = gallery.length === 0 && i === 0;
          onImageUploaded(result.url, isFeatured);

          if (result.metadata) {
            console.log(
              `Compressed: ${formatFileSize(result.metadata.originalSize)} → ${formatFileSize(result.metadata.compressedSize)} (${result.metadata.compressionRatio.toFixed(1)}% saved)`
            );
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }

      setUploadStatus('อัปโหลดสำเร็จ!');
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + (error as Error).message);
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-6 border p-6 rounded-xl bg-pink-50">
      <h2 className="text-2xl font-bold text-pink-800">
        4. รูปภาพร้านค้า (Feature Image & Gallery)
      </h2>
      <p className="text-sm text-pink-600">
        รูปภาพที่มีเครื่องหมาย ⭐ คือ ภาพหน้าปก (Feature Image)
        ซึ่งจะใช้เป็นภาพหลักในการแชร์ไปยัง Social Media
      </p>

      {/* Image Upload Area */}
      <label
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-pink-400 border-dashed rounded-lg cursor-pointer bg-pink-100/50 hover:bg-pink-100 transition ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="mt-2 text-sm text-pink-700 font-semibold">
                {uploadStatus}
              </p>
              <div className="w-64 h-2 bg-pink-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-pink-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-pink-500 mt-1">{uploadProgress}%</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-pink-500" />
              <p className="mb-2 text-sm text-pink-700">
                <span className="font-semibold">คลิกเพื่ออัพโหลด</span>{' '}
                หรือลากวางไฟล์ที่นี่
              </p>
              <p className="text-xs text-pink-500">
                รองรับ JPG, PNG, WebP, GIF (สูงสุด 10MB)
              </p>
            </>
          )}
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>

      {/* Gallery Display Area */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((img, index) => (
          <div
            key={img.id}
            className="relative group overflow-hidden rounded-lg shadow-md border-2"
            style={{ aspectRatio: '1 / 1' }}
          >
            <img
              src={img.url}
              alt={`Gallery Image ${index + 1}`}
              className={`w-full h-full object-cover transition duration-300 ${
                img.isFeatured
                  ? 'border-4 border-green-500'
                  : 'border-gray-200'
              }`}
            />

            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex justify-between items-center text-xs space-x-1">
                {img.isFeatured ? (
                  <span className="bg-green-600 text-white font-bold px-2 py-1 rounded-full">
                    ⭐ หน้าปก
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetFeatured(img.id)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1 rounded-full transition"
                  >
                    ตั้งเป็นหน้าปก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                  title="ลบรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <p className="text-center text-gray-500 py-4 border rounded-lg">
          ยังไม่มีรูปภาพในแกลเลอรี่
        </p>
      )}
    </div>
  );
};