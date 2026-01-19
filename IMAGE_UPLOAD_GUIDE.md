# Image Upload System - คู่มือการใช้งาน

## ภาพรวม

ระบบ upload รูปภาพที่มี:
- ✅ Auto image compression (ลดขนาดไฟล์ 50-80%)
- ✅ Drag & Drop support
- ✅ Multiple upload folders
- ✅ Format preservation (สำหรับ logo/icon)
- ✅ Progress tracking
- ✅ File validation

---

## 🎯 วิธีใช้งาน

### 1. ใช้ Component (แนะนำ)

```tsx
import ImageUploadZone from '@/components/admin/ImageUploadZone';

// Banner (มี compression)
<ImageUploadZone
  value={imageUrl}
  onChange={setImageUrl}
  folder="banners"
  maxSize={10}
  maxWidth={1920}
  maxHeight={1080}
  quality={0.85}
  label="รูปภาพ Banner"
/>

// Product Image (มี compression)
<ImageUploadZone
  value={imageUrl}
  onChange={setImageUrl}
  folder="products"
  maxSize={5}
  maxWidth={1200}
  maxHeight={1200}
  label="รูปภาพสินค้า"
/>

// Logo/Icon (ไม่มี compression, preserve format)
<ImageUploadZone
  value={logoUrl}
  onChange={setLogoUrl}
  folder="logos"
  maxSize={2}
  enableCompression={false}
  preserveFormat={true}
  label="Logo"
/>

// Avatar
<ImageUploadZone
  value={avatarUrl}
  onChange={setAvatarUrl}
  folder="avatars"
  maxSize={3}
  maxWidth={512}
  maxHeight={512}
  label="รูปโปรไฟล์"
/>
```

### 2. ใช้ API โดยตรง

```typescript
import { uploadFile, uploadFiles } from '@/lib/upload';

// Single file upload
const handleUpload = async (file: File) => {
  const result = await uploadFile(file, {
    folder: 'products',
    onProgress: (progress) => console.log(`${progress}%`)
  });
  
  if (result.success) {
    console.log('URL:', result.url);
  } else {
    console.error('Error:', result.error);
  }
};

// Multiple files upload
const handleMultipleUpload = async (files: File[]) => {
  const results = await uploadFiles(files, {
    folder: 'gallery'
  });
  
  const successUrls = results
    .filter(r => r.success)
    .map(r => r.url);
  
  console.log('Uploaded:', successUrls);
};

// Upload with format preservation (for logos/icons)
const handleLogoUpload = async (file: File) => {
  const result = await uploadFile(file, {
    folder: 'logos',
    preserveFormat: true // ไม่แปลงเป็น jpg
  });
};
```

### 3. ใช้ Client-side Compression + Upload

```typescript
import { compressImage } from '@/utils/imageCompression';
import { uploadFile } from '@/lib/upload';

const handleCompressAndUpload = async (file: File) => {
  // Compress first
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    mimeType: 'image/jpeg'
  });
  
  console.log(`Saved ${compressed.compressionRatio.toFixed(1)}%`);
  
  // Then upload
  const result = await uploadFile(compressed.file, {
    folder: 'banners'
  });
  
  return result.url;
};
```

---

## 📁 Upload Folders & Configurations

| Folder | Max Size | Allowed Types | Compression | Use Case |
|--------|----------|--------------|-------------|----------|
| `banners` | 10MB | JPG, PNG, WebP, GIF | ✅ (1920x1080, Q:85%) | Hero banners |
| `products` | 5MB | JPG, PNG, WebP | ✅ (1200x1200, Q:85%) | Product images |
| `gallery` | 8MB | JPG, PNG, WebP, GIF | ✅ (1920x1920, Q:85%) | Photo gallery |
| `logos` | 2MB | PNG, SVG, WebP | ❌ (preserve format) | Logos, icons, favicon |
| `avatars` | 3MB | JPG, PNG, WebP | ✅ (512x512, Q:85%) | User avatars |
| `uploads` | 5MB | All image types | ✅ (1920x1920, Q:85%) | General use |

---

## 🔧 API Endpoints

### POST `/api/upload`

**Request:**
```typescript
FormData {
  file: File,              // required
  folder: string,          // optional (default: 'uploads')
  preserveFormat: 'true'   // optional (default: false)
}
```

**Response:**
```typescript
{
  success: true,
  url: "https://...supabase.co/storage/.../banners/1234567890-abc123.jpg",
  fileName: "1234567890-abc123.jpg",
  filePath: "banners/1234567890-abc123.jpg",
  fileSize: 823456,
  fileType: "image/jpeg",
  folder: "banners"
}
```

**Error Response:**
```typescript
{
  success: false,
  error: "File too large. Maximum size is 10.0MB for Banner images.",
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
}
```

### DELETE `/api/upload?path={filePath}`

**Request:**
```
DELETE /api/upload?path=banners/1234567890-abc123.jpg
```

**Response:**
```typescript
{
  success: true,
  message: "File deleted successfully"
}
```

---

## 💡 Best Practices

### 1. Banner Images
```tsx
<ImageUploadZone
  folder="banners"
  maxWidth={1920}
  maxHeight={1080}
  quality={0.85}
  enableCompression={true}
/>
```
- ✅ ใช้ compression
- ✅ ปรับเป็น 1920x1080
- ✅ แปลงเป็ jpg

### 2. Product Images
```tsx
<ImageUploadZone
  folder="products"
  maxWidth={1200}
  maxHeight={1200}
  quality={0.85}
/>
```
- ✅ ใช้ compression
- ✅ ขนาดพอเหมาะ (1200px)
- ✅ Quality สูง (85%)

### 3. Logos & Icons
```tsx
<ImageUploadZone
  folder="logos"
  enableCompression={false}
  preserveFormat={true}
/>
```
- ❌ ไม่ compress
- ✅ เก็บ format เดิม (PNG/SVG)
- ✅ คุณภาพสูงสุด

### 4. User Avatars
```tsx
<ImageUploadZone
  folder="avatars"
  maxWidth={512}
  maxHeight={512}
  quality={0.85}
/>
```
- ✅ ขนาดเล็ก (512px)
- ✅ ใช้ compression
- ✅ เหมาะกับ profile pic

---

## 🚀 Performance Tips

### 1. ลดขนาดไฟล์
- ✅ ใช้ compression สำหรับ banner/product (ลด 50-80%)
- ✅ ตั้ง maxWidth/maxHeight ที่เหมาะสม
- ✅ Quality 0.85 = สมดุลที่ดีระหว่างขนาดและคุณภาพ

### 2. Bandwidth Saving
```typescript
// Before: 5.2 MB
// After compression: 823 KB (84% saved!)
```

### 3. User Experience
- ✅ แสดง progress bar ขณะอัปโหลด
- ✅ แสดงข้อมูลการประหยัดขนาด
- ✅ Drag & drop สะดวก

---

## 🛠 Utility Functions

### Validate Before Upload
```typescript
import { validateImageFile, getUploadConfig } from '@/lib/upload';

const config = getUploadConfig('banners');
const validation = validateImageFile(file, {
  maxSize: config.maxSize,
  allowedTypes: config.allowedTypes
});

if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### Delete File
```typescript
import { deleteFile } from '@/lib/upload';

const handleDelete = async (filePath: string) => {
  const result = await deleteFile(filePath);
  
  if (result.success) {
    console.log('Deleted successfully');
  }
};
```

### Compress Image
```typescript
import { compressImage, formatFileSize } from '@/utils/imageCompression';

const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85
});

console.log(`Original: ${formatFileSize(compressed.originalSize)}`);
console.log(`Compressed: ${formatFileSize(compressed.compressedSize)}`);
console.log(`Saved: ${compressed.compressionRatio.toFixed(1)}%`);
```

---

## 📝 ตัวอย่างการใช้งานจริง

### User Dashboard - Product Upload
```tsx
'use client';

import { useState } from 'react';
import ImageUploadZone from '@/components/admin/ImageUploadZone';

export default function ProductForm() {
  const [productImage, setProductImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  return (
    <div>
      {/* Main Product Image */}
      <ImageUploadZone
        value={productImage}
        onChange={setProductImage}
        folder="products"
        maxSize={5}
        maxWidth={1200}
        maxHeight={1200}
        label="รูปภาพหลัก"
      />

      {/* Gallery Images */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {gallery.map((url, index) => (
          <div key={index} className="relative">
            <img src={url} alt={`Gallery ${index + 1}`} />
            <button onClick={() => {
              setGallery(gallery.filter((_, i) => i !== index));
            }}>
              ลบ
            </button>
          </div>
        ))}
        
        <ImageUploadZone
          value=""
          onChange={(url) => setGallery([...gallery, url])}
          folder="gallery"
          maxSize={8}
          label="เพิ่มรูป"
        />
      </div>
    </div>
  );
}
```

---

## 🔒 Security

- ✅ Authentication required (NextAuth session)
- ✅ File type validation
- ✅ File size limits
- ✅ Sanitized filenames (timestamp + random)
- ✅ Folder-based access control

---

## 📊 Storage Info

**Supabase Storage:**
- Bucket: `Public`
- Free tier: 5GB storage + 2GB bandwidth/month
- URL format: `https://xxx.supabase.co/storage/v1/object/public/Public/{folder}/{filename}`

**Cost Optimization:**
- Image compression saves 50-80% bandwidth
- Proper sizing prevents over-upload
- Monitor usage at Supabase Dashboard

---

## 🐛 Troubleshooting

### Error: "Failed to upload file"
- ✅ Check environment variables (`.env.local`)
- ✅ Verify Supabase credentials
- ✅ Check bucket name is `Public`
- ✅ Verify bucket policies

### Error: "File too large"
- ✅ Check maxSize setting
- ✅ Compress image first
- ✅ Resize before upload

### Compression ไม่ทำงาน
- ✅ Check `enableCompression={true}`
- ✅ Don't use with SVG/logos
- ✅ Verify imageCompression utility

---

## 📞 Support

สำหรับคำถามหรือปัญหา:
1. ตรวจสอบ browser console
2. ดู server logs (terminal)
3. อ่าน error message จาก API response
