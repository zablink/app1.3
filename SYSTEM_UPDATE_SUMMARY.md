# สรุปการปรับปรุงระบบโฆษณาและ Location

## 📦 ไฟล์ที่สร้างใหม่

### 1. Database Schema
- ✅ `prisma/schema.prisma` - เพิ่ม models: `AdBanner`, `AdImpression`
- ✅ `prisma/migrations/create_ad_system.sql` - SQL migration script

### 2. API Endpoints
- ✅ `/src/app/api/user-location/route.ts` - หาตำบลจาก GPS
- ✅ `/src/app/api/ads/banners/route.ts` - ดึงโฆษณาตาม placement & location
- ✅ `/src/app/api/ads/track/route.ts` - บันทึก view/click
- ✅ `/src/app/api/ads/stats/route.ts` - Analytics & reporting

### 3. React Components & Hooks
- ✅ `/src/hooks/useAdBanner.ts` - Custom hook สำหรับจัดการโฆษณา
- ✅ `/src/components/AdBanner.tsx` - Component แสดงโฆษณา (รองรับ 3 layouts)

### 4. Documentation & Examples
- ✅ `AD_SYSTEM_GUIDE.md` - คู่มือระบบโฆษณาแบบครบวงจร
- ✅ `LOCATION_BASED_ADS_GUIDE.md` - คู่มือ location-based targeting
- ✅ `examples/ad-system-usage.tsx` - ตัวอย่างการใช้งาน 8 แบบ

---

## 🔄 ไฟล์ที่แก้ไข

### 1. API Routes
- ✅ `/src/app/api/shops/route.ts` - เปลี่ยนจาก geometry-based → distance-based

### 2. TypeScript Files (20 ไฟล์)
อัปเดตชื่อตาราง Location:
- `loc_provinces` → `th_provinces`
- `loc_amphures` → `th_districts`
- `loc_tambons` → `th_subdistricts`

**ไฟล์ที่แก้:**
- API Routes: locations, shops, category (14 ไฟล์)
- Library: location-service.ts
- Scripts: check-location-tables, update-shop-locations, etc. (4 ไฟล์)
- Pages: location-finder (1 ไฟล์)

---

## ✨ Features ใหม่

### 1. ระบบโฆษณาที่ยืดหยุ่น
```typescript
// รองรับ 7 placements
type AdPlacement = 
  | 'hero'              // หน้าแรก
  | 'sidebar'           // แถบข้าง
  | 'category_top'      // บนหมวดหมู่
  | 'category_bottom'   // ล่างหมวดหมู่
  | 'shop_detail'       // หน้าร้านค้า
  | 'search_results'    // ผลการค้นหา
  | 'footer';           // ท้ายหน้า
```

### 2. Location-based Targeting
```typescript
// กำหนดพื้นที่เป้าหมาย 4 ระดับ
type TargetAreaType =
  | 'nationwide'   // ทั่วประเทศ
  | 'province'     // จังหวัด
  | 'amphure'      // อำเภอ
  | 'tambon';      // ตำบล
```

### 3. Auto Tracking & Analytics
- ✅ บันทึก views อัตโนมัติ
- ✅ บันทึก clicks เมื่อคลิก
- ✅ คำนวณ CTR (Click-Through Rate)
- ✅ วิเคราะห์ performance ตาม placement
- ✅ รายงาน unique users/sessions

### 4. Priority-based Display
```sql
ORDER BY
  relevance_score DESC,  -- ตรงพื้นที่มากที่สุด
  priority DESC,         -- Priority สูงกว่า
  ctr DESC,              -- CTR ดีกว่า
  RANDOM()               -- สุ่มเพื่อความยุติธรรม
```

---

## 🚀 การใช้งาน

### Quick Start - Frontend
```tsx
import { AdBanner } from '@/components/AdBanner';

// 1. Hero Banner (หน้าแรก)
<AdBanner placement="hero" tambonId={123} />

// 2. Sidebar Ads (3 โฆษณา)
<AdBanner placement="sidebar" limit={3} layout="stack" />

// 3. Category Banner
<AdBanner placement="category_top" amphureId={45} />
```

### Quick Start - Hook
```tsx
import { useAdBanner } from '@/hooks/useAdBanner';

const { banners, loading, trackClick } = useAdBanner({
  placement: 'hero',
  tambonId: 123,
  autoTrackView: true  // บันทึก view อัตโนมัติ
});
```

### Quick Start - API
```bash
# 1. หาตำบลของ user
GET /api/user-location?lat=13.7563&lng=100.5018

# 2. ดึงโฆษณา
GET /api/ads/banners?placement=hero&tambon_id=123&limit=5

# 3. ดูสถิติ
GET /api/ads/stats?groupBy=placement
```

---

## 📊 Database Schema

### Table: `ad_banners`
- กเก็บข้อมูลโฆษณา
- รองรับหลาย placement
- Location-based targeting
- Priority & scheduling
- View/click counters

### Table: `ad_impressions`
- บันทึก views และ clicks
- เก็บ user location
- เก็บ session info
- สำหรับ analytics

---

## 🔧 ขั้นตอนติดตั้ง

### 1. Database Migration
```bash
# Option 1: Prisma Migrate
npx prisma migrate dev --name add_ad_system

# Option 2: Manual SQL
psql $DATABASE_URL < prisma/migrations/create_ad_system.sql
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Verify Setup
```bash
npx prisma studio
# ตรวจสอบว่ามีตาราง ad_banners และ ad_impressions
```

### 4. Test API
```bash
# ทดสอบ user location
curl "http://localhost:3000/api/user-location?lat=13.7563&lng=100.5018"

# ทดสอบดึงโฆษณา
curl "http://localhost:3000/api/ads/banners?placement=hero"
```

---

## 📈 Next Steps

### Phase 1: ตอนนี้ (เสร็จแล้ว ✅)
- [x] Multi-placement support
- [x] Location-based targeting
- [x] Auto tracking (views/clicks)
- [x] Basic analytics
- [x] React components & hooks

### Phase 2: ต่อไป
1. **เพิ่มโฆษณาในหน้าต่างๆ**
   - Home page
   - Category pages
   - Shop detail pages
   - Search results

2. **Admin Panel สำหรับจัดการโฆษณา**
   - สร้างโฆษณาใหม่
   - เลือก placement
   - กำหนดพื้นที่เป้าหมาย
   - ดูสถิติ

3. **Migration จาก HeroBanner เดิม**
   - ย้ายข้อมูลจาก `hero_banners` → `ad_banners`
   - อัปเดต code ที่ใช้ HeroBanner เดิม

### Phase 3: อนาคต
- [ ] Video ads
- [ ] Rich media ads
- [ ] Frequency capping
- [ ] Conversion tracking
- [ ] Self-service ad platform
- [ ] Payment integration

---

## 📁 File Structure

```
zablink/app1.3/
├── prisma/
│   ├── schema.prisma (แก้ไข)
│   └── migrations/
│       └── create_ad_system.sql (ใหม่)
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── user-location/route.ts (ใหม่)
│   │       ├── ads/
│   │       │   ├── banners/route.ts (ใหม่)
│   │       │   ├── track/route.ts (ใหม่)
│   │       │   └── stats/route.ts (ใหม่)
│   │       └── shops/route.ts (แก้ไข)
│   ├── components/
│   │   └── AdBanner.tsx (ใหม่)
│   ├── hooks/
│   │   └── useAdBanner.ts (ใหม่)
│   └── lib/
│       └── location-service.ts (แก้ไข)
├── examples/
│   └── ad-system-usage.tsx (ใหม่)
└── docs/
    ├── AD_SYSTEM_GUIDE.md (ใหม่)
    └── LOCATION_BASED_ADS_GUIDE.md (ใหม่)
```

---

## 🎯 สรุป

### ปัญหาที่แก้ไข
1. ✅ ร้านค้าหาตาม geometry ไม่ได้ (52 ตำบลไม่มี geometry)
   - **แก้:** ใช้ distance-based แทน

2. ✅ โฆษณาต้องแสดงตามพื้นที่ของ user
   - **แก้:** สร้าง API `/user-location` หาตำบลจาก GPS

3. ✅ ต้องรองรับหลาย placement สำหรับขายโฆษณา
   - **แก้:** ระบบโฆษณาใหม่ที่ยืดหยุ่น

### ความสามารถใหม่
- ✅ แสดงโฆษณาได้ 7 ตำแหน่ง
- ✅ กำหนดพื้นที่เป้าหมายได้ 4 ระดับ
- ✅ บันทึก views/clicks อัตโนมัติ
- ✅ วิเคราะห์ CTR และประสิทธิภาพ
- ✅ ใช้งานง่ายด้วย Component และ Hook

### พร้อมสำหรับ
- 🚀 ขายโฆษณาในหลายตำแหน่ง
- 🎯 กำหนดพื้นที่เป้าหมายได้แม่นยำ
- 📊 วิเคราะห์และรายงานผล
- 📈 ขยายระบบในอนาคต

---

**ระบบโฆษณาพร้อมใช้งานแล้ว!** 🎉
