# Favicon Management Guide

## Overview

ระบบ Favicon ถูกปรับปรุงให้รองรับหลายขนาดและอุปกรณ์ต่างๆ เพื่อให้แสดงผลได้ดีที่สุดในทุกแพลตฟอร์ม

## Favicon Types & Sizes

### 1. Browser Favicons
- **16x16**: แท็บเบราว์เซอร์ (Standard)
- **32x32**: แท็บเบราว์เซอร์ (Retina Display)

### 2. Apple Devices
- **180x180**: Apple Touch Icon (สำหรับ iOS Home Screen)

### 3. Progressive Web App (PWA)
- **192x192**: Android Chrome, PWA
- **512x512**: PWA Splash Screen

### 4. Legacy
- **favicon.ico**: สำหรับเบราว์เซอร์เก่าที่ไม่รองรับ PNG

## Database Schema

```sql
site_settings table:
- site_favicon_16      (16x16 PNG)
- site_favicon_32      (32x32 PNG)
- site_apple_touch_icon (180x180 PNG)
- site_icon_192        (192x192 PNG)
- site_icon_512        (512x512 PNG)
- site_manifest_json   (path to manifest file)
- site_favicon         (legacy .ico file)
```

## Setup Instructions

### 1. Run Migration

```bash
# Apply database migration
npx prisma migrate dev --name add_favicon_settings

# Or run SQL directly
psql -d your_database -f prisma/migrations/20241123_add_favicon_settings/migration.sql
```

### 2. Seed Favicon Settings

```bash
# Run seed script
npx tsx scripts/seed-favicon-settings.ts
```

### 3. Upload Favicon Files

1. ไปที่ Admin Settings → Branding
2. ในส่วน "Favicons & Icons" จะเห็นช่องอัปโหลดหลายช่อง
3. อัปโหลดรูปภาพแต่ละขนาดตามที่กำหนด

## Image Requirements

### Format
- รองรับ: PNG, SVG, WebP, ICO
- แนะนำ: PNG (สำหรับความชัดเจน)

### Size Guidelines
| Type | Size | Format | Purpose |
|------|------|--------|---------|
| Favicon 16x16 | 16×16 | PNG | Browser tab (standard) |
| Favicon 32x32 | 32×32 | PNG | Browser tab (retina) |
| Apple Touch | 180×180 | PNG | iOS home screen |
| PWA Icon 192 | 192×192 | PNG | Android PWA |
| PWA Icon 512 | 512×512 | PNG | PWA splash screen |
| Legacy Favicon | 16×16 | ICO | Old browsers |

## Usage in Code

### Getting Favicon URLs

```typescript
import { getSiteMetadata } from '@/lib/settings';

// In a Server Component or API Route
const metadata = await getSiteMetadata();

console.log(metadata.icons);
// {
//   icon: [
//     { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
//     { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
//   ],
//   apple: '/apple-touch-icon.png',
//   other: [...]
// }
```

### In Next.js Layout

```typescript
// app/layout.tsx
import { getSiteMetadata } from '@/lib/settings';

export async function generateMetadata() {
  return await getSiteMetadata();
}
```

## Creating Favicons from Source

### Using Online Tools
1. **Favicon Generator**: https://realfavicongenerator.net/
   - อัปโหลดรูป logo ขนาดใหญ่ (512x512 ขึ้นไป)
   - เครื่องมือจะสร้างทุกขนาดให้อัตโนมัติ
   - ดาวน์โหลดและอัปโหลดแต่ละไฟล์ไปยัง Admin Settings

2. **ImageMagick** (Command Line)
```bash
# สร้างจาก source image
convert logo.png -resize 16x16 favicon-16x16.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 180x180 apple-touch-icon.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Design Tips
- ใช้รูปที่ชัดเจน simple ไม่ซับซ้อนเกินไป
- ขนาดเล็กๆ (16x16, 32x32) ควรใช้ icon ที่เรียบง่าย
- ทดสอบใน dark mode และ light mode
- ใช้ background ที่เหมาะสม (transparent หรือสีพื้น)

## Web App Manifest

สร้างไฟล์ `public/site.webmanifest`:

```json
{
  "name": "Zablink",
  "short_name": "Zablink",
  "description": "แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ea580c",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Browser Compatibility

| Browser | Favicon Support |
|---------|----------------|
| Chrome/Edge | 16x16, 32x32, 192x192, 512x512 |
| Firefox | 16x16, 32x32 |
| Safari | 16x16, 32x32, Apple Touch Icon |
| iOS Safari | Apple Touch Icon (180x180) |
| Android Chrome | 192x192, 512x512 |

## Troubleshooting

### Favicons not updating?
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
2. Check file paths in database
3. Verify files exist in `/public` or uploaded location
4. Wait 5 minutes for Next.js cache to clear

### Wrong size showing?
- Browser จะเลือกขนาดที่เหมาะสมโดยอัตโนมัติ
- ตรวจสอบว่าได้อัปโหลดทุกขนาดแล้ว

### PWA not working?
- ตรวจสอบ `site.webmanifest` มี icons ครบ
- ตรวจสอบ HTTPS (PWA ต้องใช้ HTTPS)
- ใช้ Chrome DevTools → Application → Manifest

## Admin Interface

### การจัดการผ่าน UI

1. เข้า `/admin/settings`
2. เลือกแท็บ "แบรนด์" (Branding)
3. เลื่อนลงไปที่ส่วน "🎯 Favicons & Icons"
4. จะเห็น:
   - ช่องอัปโหลดแยกตามขนาด
   - Preview รูปภาพปัจจุบัน
   - คำอธิบายขนาดที่แนะนำ
5. อัปโหลดรูปหรือใส่ URL
6. กด "บันทึก" ที่ด้านบน

## Migration Checklist

- [x] สร้าง migration SQL
- [x] สร้าง seed script
- [x] อัปเดต UI (Admin Settings)
- [x] อัปเดต `lib/settings.ts`
- [x] เพิ่ม FaviconField component
- [x] จัดกลุ่ม favicon ในหน้า Branding
- [x] สร้างเอกสาร README

## Next Steps

1. รัน migration: `npx tsx scripts/seed-favicon-settings.ts`
2. อัปโหลด favicon files ผ่าน Admin UI
3. ทดสอบในเบราว์เซอร์ต่างๆ
4. สร้าง `site.webmanifest` ใน public folder
5. ทดสอบ PWA installation
