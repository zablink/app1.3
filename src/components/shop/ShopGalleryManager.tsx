// components/shop/ShopGalleryManager.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Star, Loader } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  is_featured: boolean;
  uploaded_at: string;
}

interface ShopGalleryManagerProps {
  shopId: string;
  initialImages?: GalleryImage[];
  maxImages?: number;
}

export default function ShopGalleryManager({ 
  shopId, 
  initialImages = [],
  maxImages = 10 
}: ShopGalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`สามารถอัปโหลดได้สูงสุด ${maxImages} รูป`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('shopId', shopId);

        const response = await fetch('/api/shop/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        return response.json();
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedImages]);
    } catch (err) {
      setError('ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('คุณต้องการลบรูปภาพนี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/shop/upload-image?id=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      setError('ไม่สามารถลบรูปภาพได้');
    }
  };

  const handleSetFeatured = async (imageId: string) => {
    try {
      const response = await fetch('/api/shop/upload-image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, is_featured: true }),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      // Update local state
      setImages(images.map(img => ({
        ...img,
        is_featured: img.id === imageId
      })));
    } catch (err) {
      setError('ไม่สามารถตั้งรูปเด่นได้');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          รูปภาพร้าน ({images.length}/{maxImages})
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">กำลังอัปโหลด...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP (สูงสุด 5MB)</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={image.image_url}
                  alt="Shop image"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  onClick={() => handleSetFeatured(image.id)}
                  className={`p-2 rounded-full ${
                    image.is_featured 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                  } transition-colors`}
                  title="ตั้งเป็นรูปเด่น"
                >
                  <Star className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="ลบรูป"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Featured Badge */}
              {image.is_featured && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  รูปเด่น
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Named export for compatibility
export { ShopGalleryManager };
