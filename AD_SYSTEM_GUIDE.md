# ระบบโฆษณาแบบครบวงจร (Advanced Ad System)

## 📋 สารบัญ
1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Database Schema](#database-schema)
3. [การติดตั้ง](#การติดตั้ง)
4. [API Endpoints](#api-endpoints)
5. [การใช้งานใน Frontend](#การใช้งานใน-frontend)
6. [Admin Panel](#admin-panel)
7. [Analytics & Reporting](#analytics--reporting)
8. [Best Practices](#best-practices)

---

## ภาพรวมระบบ

### ✨ Features
- ✅ **Multi-Placement Support** - รองรับหลายตำแหน่งแสดงโฆษณา (hero, sidebar, category, etc.)
- ✅ **Location-based Targeting** - กำหนดพื้นที่เป้าหมาย (nationwide/province/amphure/tambon)
- ✅ **Priority & Scheduling** - จัดลำดับและกำหนดเวลาแสดง
- ✅ **Auto Tracking** - บันทึก views และ clicks อัตโนมัติ
- ✅ **Analytics Ready** - พร้อมระบบวิเคราะห์ CTR และประสิทธิภาพ
- ✅ **Flexible Layout** - รองรับ carousel, grid, และ stack layouts

### 🎯 Placements ที่รองรับ
```typescript
type AdPlacement = 
  | 'hero'              // แบนเนอร์หน้าแรก (ใหญ่ที่สุด)
  | 'sidebar'           // แถบด้านข้าง
  | 'category_top'      // ด้านบนหน้าหมวดหมู่
  | 'category_bottom'   // ด้านล่างหน้าหมวดหมู่
  | 'shop_detail'       // หน้ารายละเอียดร้านค้า
  | 'search_results'    // หน้าผลการค้นหา
  | 'footer';           // ด้านล่างสุดของหน้า
```

---

## Database Schema

### ตาราง `ad_banners`
```sql
CREATE TABLE ad_banners (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- ข้อมูลพื้นฐาน
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT NOT NULL,
  link_url        TEXT,
  
  -- Placement
  placement       TEXT NOT NULL DEFAULT 'hero',
  
  -- Location Targeting
  target_area_type TEXT,  -- 'nationwide' | 'province' | 'amphure' | 'tambon'
  target_area_id   INT,   -- FK ไป th_provinces, th_districts, หรือ th_subdistricts
  
  -- Priority & Scheduling
  priority        INT NOT NULL DEFAULT 0,
  start_date      TIMESTAMP,
  end_date        TIMESTAMP,
  
  -- Status & Performance
  is_active       BOOLEAN NOT NULL DEFAULT true,
  view_count      INT NOT NULL DEFAULT 0,
  click_count     INT NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by      TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ad_banners_placement ON ad_banners(placement, is_active);
CREATE INDEX idx_ad_banners_target ON ad_banners(target_area_type, target_area_id);
CREATE INDEX idx_ad_banners_priority ON ad_banners(priority DESC);
CREATE INDEX idx_ad_banners_schedule ON ad_banners(start_date, end_date);
```

### ตาราง `ad_impressions`
```sql
CREATE TABLE ad_impressions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  banner_id   TEXT NOT NULL,
  
  -- User Info
  user_id     TEXT,
  session_id  TEXT,
  tambon_id   INT,
  amphure_id  INT,
  province_id INT,
  
  -- Event Info
  event_type  TEXT NOT NULL DEFAULT 'view',  -- 'view' | 'click'
  page        TEXT,
  user_agent  TEXT,
  ip_address  TEXT,
  
  -- Timestamp
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ad_impressions_banner ON ad_impressions(banner_id, event_type);
CREATE INDEX idx_ad_impressions_date ON ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_location ON ad_impressions(tambon_id);
```

---

## การติดตั้ง

### 1. Update Prisma Schema
```bash
# Schema ถูกอัปเดตแล้วใน prisma/schema.prisma
npx prisma db push
# หรือ
npx prisma migrate dev --name add_ad_system
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Verify Tables
```bash
npx prisma studio
# ตรวจสอบว่ามีตาราง ad_banners และ ad_impressions แล้ว
```

---

## API Endpoints

### 1. ดึงโฆษณา
**GET** `/api/ads/banners`

**Query Parameters:**
```typescript
{
  placement: string,      // required: 'hero' | 'sidebar' | etc.
  tambon_id?: number,     // optional
  amphure_id?: number,    // optional
  province_id?: number,   // optional
  limit?: number          // optional, default: 5
}
```

**Response:**
```json
{
  "success": true,
  "banners": [
    {
      "id": "uuid-123",
      "title": "โฆษณาร้านอาหาร",
      "description": "ลดราคา 50%",
      "imageUrl": "https://...",
      "linkUrl": "https://...",
      "placement": "hero",
      "targetArea": {
        "type": "tambon",
        "id": 123
      },
      "stats": {
        "views": 1000,
        "clicks": 50,
        "ctr": 5.0
      }
    }
  ],
  "metadata": {
    "placement": "hero",
    "userLocation": {
      "tambonId": 123,
      "amphureId": 45,
      "provinceId": 1
    },
    "count": 1
  }
}
```

**ตัวอย่างการใช้:**
```typescript
// ดึงโฆษณาหน้าแรก สำหรับ user ในตำบลบางพลัด
const response = await fetch(
  '/api/ads/banners?placement=hero&tambon_id=123&limit=3'
);
const data = await response.json();
```

---

### 2. บันทึก View/Click
**POST** `/api/ads/track`

**Body:**
```json
{
  "bannerId": "uuid-123",
  "eventType": "view",      // 'view' | 'click'
  "userId": "user-456",     // optional (if logged in)
  "sessionId": "session-789",
  "tambonId": 123,          // optional
  "amphureId": 45,          // optional
  "provinceId": 1,          // optional
  "page": "/shops/category/food"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 3. ดูสถิติโฆษณา
**GET** `/api/ads/stats`

**Query Parameters:**
```typescript
{
  bannerId?: string,      // optional: ดูสถิติเฉพาะโฆษณา
  placement?: string,     // optional: กรองตาม placement
  startDate?: string,     // optional: ISO date
  endDate?: string,       // optional: ISO date
  groupBy?: 'banner' | 'placement' | 'location' | 'date'
}
```

**Response (groupBy=banner):**
```json
{
  "success": true,
  "groupBy": "banner",
  "data": [
    {
      "bannerId": "uuid-123",
      "title": "โฆษณาร้านอาหาร",
      "placement": "hero",
      "views": 1000,
      "clicks": 50,
      "ctr": 5.0
    }
  ]
}
```

**Response (groupBy=placement):**
```json
{
  "success": true,
  "groupBy": "placement",
  "data": [
    {
      "placement": "hero",
      "totalBanners": 5,
      "views": 5000,
      "clicks": 250,
      "ctr": 5.0
    }
  ]
}
```

---

## การใช้งานใน Frontend

### 1. ใช้ React Hook
```tsx
'use client';

import { useAdBanner } from '@/hooks/useAdBanner';

export function MyPage() {
  const { banners, loading, trackClick } = useAdBanner({
    placement: 'hero',
    tambonId: 123,
    limit: 3,
    autoTrackView: true  // บันทึก view อัตโนมัติ
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {banners.map(banner => (
        <a
          key={banner.id}
          href={banner.linkUrl || '#'}
          onClick={() => trackClick(banner.id)}
        >
          <img src={banner.imageUrl} alt={banner.title} />
        </a>
      ))}
    </div>
  );
}
```

### 2. ใช้ Component สำเร็จรูป
```tsx
import { AdBanner } from '@/components/AdBanner';

export function HomePage() {
  return (
    <div>
      {/* Hero Banner */}
      <AdBanner 
        placement="hero" 
        tambonId={123}
        layout="carousel"
      />

      {/* Sidebar Ads */}
      <aside>
        <AdBanner 
          placement="sidebar" 
          limit={3}
          layout="stack"
        />
      </aside>

      {/* Category Top Banner */}
      <AdBanner 
        placement="category_top"
        amphureId={45}
        layout="grid"
      />
    </div>
  );
}
```

### 3. ดึงตำบลของ User ก่อน
```tsx
'use client';

import { useEffect, useState } from 'react';
import { AdBanner } from '@/components/AdBanner';

export function SmartAdPage() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // 1. ขอ GPS
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // 2. หาตำบล
      const res = await fetch(
        `/api/user-location?lat=${latitude}&lng=${longitude}`
      );
      const data = await res.json();
      setLocation(data);
    });
  }, []);

  if (!location) return <div>Loading...</div>;

  return (
    <div>
      {/* โฆษณาจะแสดงตามตำบลที่ user อยู่ */}
      <AdBanner 
        placement="hero"
        tambonId={location.tambon_id}
        amphureId={location.amphure_id}
        provinceId={location.province_id}
      />
    </div>
  );
}
```

---

## Admin Panel

### การสร้างโฆษณาใหม่

```typescript
// Example: Admin create banner form
const createBanner = async (formData) => {
  await prisma.adBanner.create({
    data: {
      title: formData.title,
      description: formData.description,
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl,
      
      // Placement
      placement: formData.placement, // 'hero' | 'sidebar' | etc.
      
      // Location Targeting
      targetAreaType: formData.areaType,  // 'nationwide' | 'province' | 'amphure' | 'tambon'
      targetAreaId: formData.areaId,       // null สำหรับ nationwide
      
      // Priority & Schedule
      priority: formData.priority || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      
      // Status
      isActive: true,
      createdBy: session.user.id
    }
  });
};
```

### ตัวอย่างข้อมูล

```typescript
// โฆษณาทั่วประเทศ - แสดงที่ Hero
{
  title: "ส่งฟรีทั่วประเทศ",
  placement: "hero",
  targetAreaType: "nationwide",
  targetAreaId: null,
  priority: 10
}

// โฆษณาเฉพาะกรุงเทพฯ - แสดงที่ Sidebar
{
  title: "โปรโมชั่นกรุงเทพฯ",
  placement: "sidebar",
  targetAreaType: "province",
  targetAreaId: 1,  // Bangkok
  priority: 8
}

// โฆษณาเฉพาะอำเภอบางพลัด - แสดงที่ Category Top
{
  title: "ร้านอาหารบางพลัด",
  placement: "category_top",
  targetAreaType: "amphure",
  targetAreaId: 45,
  priority: 5
}

// โฆษณาเฉพาะตำบล - แสดงที่ Shop Detail
{
  title: "ร้านใกล้บ้านคุณ",
  placement: "shop_detail",
  targetAreaType: "tambon",
  targetAreaId: 123,
  priority: 3
}
```

---

## Analytics & Reporting

### 1. Dashboard Overview
```typescript
// ดูภาพรวมทั้งหมด
const stats = await fetch('/api/ads/stats?groupBy=placement');

// Response:
{
  "hero": { views: 10000, clicks: 500, ctr: 5.0 },
  "sidebar": { views: 5000, clicks: 150, ctr: 3.0 },
  "category_top": { views: 3000, clicks: 90, ctr: 3.0 }
}
```

### 2. โฆษณาที่มี Performance ดีที่สุด
```sql
SELECT 
  id,
  title,
  placement,
  view_count,
  click_count,
  ROUND((click_count::NUMERIC / NULLIF(view_count, 0) * 100), 2) as ctr
FROM ad_banners
WHERE is_active = true
ORDER BY ctr DESC
LIMIT 10;
```

### 3. ROI Analysis
```sql
-- วิเคราะห์ว่าพื้นที่ไหนมี CTR สูงสุด
SELECT 
  target_area_type,
  target_area_id,
  SUM(view_count) as total_views,
  SUM(click_count) as total_clicks,
  ROUND((SUM(click_count)::NUMERIC / NULLIF(SUM(view_count), 0) * 100), 2) as avg_ctr
FROM ad_banners
WHERE is_active = true
  AND target_area_type IS NOT NULL
GROUP BY target_area_type, target_area_id
ORDER BY avg_ctr DESC;
```

---

## Best Practices

### 1. Image Optimization
- ใช้ Next.js Image component
- Compress images ก่อนอัพโหลด
- ใช้ WebP format
- Lazy load สำหรับโฆษณาที่ไม่ใช่ hero

### 2. Performance
- Cache banners ที่ Frontend (5-10 นาที)
- ใช้ CDN สำหรับรูปภาพ
- Track view/click แบบ async (ไม่ block UI)

### 3. Privacy
- ไม่เก็บ IP address ในบาง regions
- Respect Do Not Track header
- ให้ user opt-out ได้

### 4. A/B Testing
```typescript
// สุ่มแสดงโฆษณาเพื่อทดสอบ
const banners = await fetchBanners({ 
  placement: 'hero',
  limit: 10  // ดึงมาเยอะๆ แล้วสุ่มแสดง
});

// แสดงแบบ random
const randomBanner = banners[Math.floor(Math.random() * banners.length)];
```

### 5. Fallback
```typescript
// ถ้าไม่มีโฆษณาตรงพื้นที่ → fallback ไปโฆษณาทั่วประเทศ
const banners = await fetchBanners({
  placement: 'hero',
  tambonId: 123
});

if (banners.length === 0) {
  // Retry with nationwide
  const fallbackBanners = await fetchBanners({
    placement: 'hero',
    targetAreaType: 'nationwide'
  });
}
```

---

## Testing

### 1. ทดสอบ API
```bash
# ดึงโฆษณา
curl "http://localhost:3000/api/ads/banners?placement=hero&tambon_id=123"

# บันทึก view
curl -X POST http://localhost:3000/api/ads/track \
  -H "Content-Type: application/json" \
  -d '{"bannerId":"uuid-123","eventType":"view","sessionId":"test-session"}'

# ดูสถิติ
curl "http://localhost:3000/api/ads/stats?groupBy=placement"
```

### 2. ทดสอบ Component
```tsx
import { render, screen } from '@testing-library/react';
import { AdBanner } from '@/components/AdBanner';

test('shows banner when available', async () => {
  render(<AdBanner placement="hero" />);
  const banner = await screen.findByAlt(/banner/i);
  expect(banner).toBeInTheDocument();
});
```

---

## Migration จาก Hero Banner เดิม

```typescript
// Script สำหรับ migrate hero_banners → ad_banners
async function migrateHeroBanners() {
  const oldBanners = await prisma.heroBanner.findMany({
    where: { isActive: true }
  });

  for (const old of oldBanners) {
    await prisma.adBanner.create({
      data: {
        title: old.title,
        description: old.subtitle,
        imageUrl: old.imageUrl,
        linkUrl: old.ctaLink || old.link,
        placement: 'hero',
        targetAreaType: 'nationwide', // เดิมไม่มี targeting
        priority: old.priority,
        startDate: old.startDate,
        endDate: old.endDate,
        isActive: old.isActive
      }
    });
  }
}
```

---

## Roadmap

### Phase 1 (ปัจจุบัน) ✅
- [x] Multi-placement support
- [x] Location-based targeting
- [x] View/Click tracking
- [x] Basic analytics

### Phase 2 (อนาคต)
- [ ] Video ads support
- [ ] Rich media ads
- [ ] Frequency capping (จำกัดครั้งที่แสดงต่อ user)
- [ ] Conversion tracking
- [ ] Real-time bidding (RTB)

### Phase 3 (อนาคต)
- [ ] Self-service ad platform
- [ ] Payment integration
- [ ] Advanced targeting (demographics, interests)
- [ ] Programmatic advertising

---

## สรุป

ระบบโฆษณาใหม่นี้:
1. ✅ **ยืดหยุ่น** - รองรับหลาย placement
2. ✅ **แม่นยำ** - Location-based targeting
3. ✅ **วัดผลได้** - Auto tracking & analytics
4. ✅ **พร้อมขยาย** - สามารถเพิ่ม placement ใหม่ได้ง่าย
5. ✅ **ใช้งานง่าย** - มี Hook และ Component สำเร็จรูป

พร้อมรองรับการขายโฆษณาในอนาคต! 🚀
