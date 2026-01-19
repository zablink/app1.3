# วิธีการใช้งานระบบโฆษณาตามพื้นที่ (Location-based Banners)

## ปัญหาที่แก้ไข

1. ✅ **ร้านค้า**: เปลี่ยนจากการหาตาม geometry (tambon/amphure/province) → ใช้ **distance-based** เท่านั้น
   - เหตุผล: มี 52 ตำบลที่ไม่มี geometry ทำให้ GPS บางจุดหาพื้นที่ไม่เจอ
   - วิธีแก้: ใช้ `ST_Distance` หาร้านที่ใกล้ที่สุดภายในรัศมี [2, 5, 20, 50 km]

2. 🔧 **โฆษณา**: ต้องหาว่าลูกค้าอยู่ตำบลไหน (แม้ GPS ไม่ตรง) เพื่อแสดงโฆษณาที่เหมาะสม

---

## การแก้ไขที่ทำแล้ว

### 1. แก้ไฟล์ `/src/app/api/shops/route.ts`

ลบการหา area-based query (geometry lookup) ออก → ใช้ distance-based เท่านั้น

```typescript
// ❌ เดิม: หา tambon/amphure/province จาก geometry ก่อน
const tambonId = await findAreaId('th_subdistricts', ...);
if (tambonId) { ... }

// ✅ ใหม่: ใช้ distance-based เลย (ไม่ต้องหา geometry)
// หาร้านที่ใกล้ที่สุดภายในรัศมี 2, 5, 20, 50 km
for (const r of radiiMeters) {
  // ST_DWithin query...
}
```

### 2. สร้าง API `/src/app/api/user-location/route.ts`

API สำหรับหาตำบล/อำเภอ/จังหวัดของ user จาก GPS (ใช้กับการกรองโฆษณา)

**Endpoint**: `GET /api/user-location?lat={lat}&lng={lng}`

**Response**:
```json
{
  "tambon_id": 123,
  "tambon_name": "บางพลัด",
  "amphure_id": 45,
  "amphure_name": "บางพลัด",
  "province_id": 1,
  "province_name": "กรุงเทพมหานคร",
  "method": "contains",  // หรือ "nearest" หรือ "none"
  "distance_km": 0.5  // (ถ้าใช้ nearest method)
}
```

**Logic**:
1. ลอง `ST_Contains` ก่อน (แม่นยำที่สุด) - ถ้า GPS อยู่ภายใน geometry
2. ถ้าไม่เจอ → หาตำบลที่ **ใกล้ที่สุด** ด้วย `ST_Distance`
3. ส่ง `method` กลับมาเพื่อบอกว่าใช้วิธีไหน

---

## วิธีใช้งานกับโฆษณา

### ขั้นตอน 1: เพิ่ม columns ในตาราง `banners`

เพิ่ม fields เหล่านี้เข้าไปใน schema:

```sql
ALTER TABLE banners 
ADD COLUMN target_area_type VARCHAR(20), -- 'nationwide' | 'province' | 'amphure' | 'tambon'
ADD COLUMN target_area_id INT,           -- id ของพื้นที่ที่กำหนด
ADD COLUMN start_date TIMESTAMP,
ADD COLUMN end_date TIMESTAMP;

-- Create index for better performance
CREATE INDEX idx_banners_target ON banners(target_area_type, target_area_id, is_active);
```

### ขั้นตอน 2: อัพเดต Prisma Schema

```prisma
model banners {
  id               Int       @id @default(autoincrement())
  image            String
  link             String?
  order            Int?      @default(0)
  is_active        Boolean?  @default(true)
  target_area_type String?   // 'nationwide' | 'province' | 'amphure' | 'tambon'
  target_area_id   Int?      // FK ไป th_provinces, th_districts, หรือ th_subdistricts
  start_date       DateTime?
  end_date         DateTime?
  created_at       DateTime? @default(now()) @db.Timestamptz(6)
  updated_at       DateTime? @default(now()) @db.Timestamptz(6)

  @@index([order])
  @@index([target_area_type, target_area_id, is_active])
}
```

### ขั้นตอน 3: แก้ไข `/src/app/api/banners/route.ts`

เพิ่ม logic สำหรับกรองโฆษณาตามพื้นที่:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tambonId = searchParams.get('tambon_id');
  const amphureId = searchParams.get('amphure_id');
  const provinceId = searchParams.get('province_id');
  
  const banners = await prisma.$queryRaw`
    SELECT *
    FROM banners
    WHERE is_active = true
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
      AND (
        -- โฆษณาแบบ nationwide
        target_area_type = 'nationwide'
        -- หรือโฆษณาตำบลที่ user อยู่
        OR (target_area_type = 'tambon' AND target_area_id = ${tambonId})
        -- หรือโฆษณาอำเภอที่ user อยู่
        OR (target_area_type = 'amphure' AND target_area_id = ${amphureId})
        -- หรือโฆษณาจังหวัดที่ user อยู่
        OR (target_area_type = 'province' AND target_area_id = ${provinceId})
      )
    ORDER BY 
      CASE 
        WHEN target_area_type = 'tambon' THEN 1
        WHEN target_area_type = 'amphure' THEN 2
        WHEN target_area_type = 'province' THEN 3
        ELSE 4
      END,
      "order" DESC,
      RANDOM()
    LIMIT 10
  `;
  
  return NextResponse.json({ banners });
}
```

---

## วิธีใช้งานใน Frontend

### ตัวอย่าง: หน้าแรก (Home Page)

```tsx
// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [shops, setShops] = useState([]);
  const [banners, setBanners] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // 1. ขอ GPS จาก browser
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // 2. หาตำบลของ user
      const locationRes = await fetch(
        `/api/user-location?lat=${latitude}&lng=${longitude}`
      );
      const location = await locationRes.json();
      setUserLocation(location);
      
      // 3. ดึงร้านค้าใกล้เคียง (distance-based)
      const shopsRes = await fetch(
        `/api/shops?lat=${latitude}&lng=${longitude}&limit=20`
      );
      const shopsData = await shopsRes.json();
      setShops(shopsData.shops);
      
      // 4. ดึงโฆษณาที่เหมาะสม (location-based)
      const bannersRes = await fetch(
        `/api/banners?tambon_id=${location.tambon_id}&amphure_id=${location.amphure_id}&province_id=${location.province_id}`
      );
      const bannersData = await bannersRes.json();
      setBanners(bannersData.banners);
    });
  }, []);

  return (
    <div>
      {/* แสดงโฆษณา */}
      <div className="banners">
        {banners.map(banner => (
          <img key={banner.id} src={banner.image} alt={banner.title} />
        ))}
      </div>
      
      {/* แสดงร้านค้า */}
      <div className="shops">
        {shops.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
}
```

---

## การจัดการโฆษณาใน Admin Panel

### ตัวอย่างการสร้างโฆษณา

```typescript
// Admin form สำหรับสร้างโฆษณา
const createBanner = async (data) => {
  await prisma.banners.create({
    data: {
      image: data.imageUrl,
      link: data.link,
      order: data.order,
      is_active: true,
      
      // กำหนดพื้นที่แสดงโฆษณา
      target_area_type: data.areaType, // 'nationwide' | 'province' | 'amphure' | 'tambon'
      target_area_id: data.areaId,     // id ของพื้นที่ที่เลือก
      
      start_date: data.startDate,
      end_date: data.endDate,
    }
  });
};

// ตัวอย่างข้อมูล:
// - โฆษณาทั่วประเทศ: { areaType: 'nationwide', areaId: null }
// - โฆษณาในกรุงเทพฯ: { areaType: 'province', areaId: 1 }
// - โฆษณาในอำเภอบางพลัด: { areaType: 'amphure', areaId: 45 }
// - โฆษณาในตำบลบางพลัด: { areaType: 'tambon', areaId: 123 }
```

---

## สรุป

### ✅ สิ่งที่ทำแล้ว:
1. แก้ API `/api/shops` ให้ใช้ distance-based แทน geometry-based
2. สร้าง API `/api/user-location` สำหรับหาตำบลของ user

### 🔧 สิ่งที่ต้องทำต่อ (ขึ้นอยู่กับโครงสร้าง database ของคุณ):
1. เพิ่ม columns `target_area_type` และ `target_area_id` ใน table `banners`
2. อัพเดต Prisma schema
3. Run migration: `npx prisma migrate dev`
4. แก้ไข API `/api/banners` ให้รองรับการกรองตามพื้นที่
5. อัพเดต Admin Panel ให้เลือกพื้นที่เป้าหมายได้ตอนสร้างโฆษณา
6. อัพเดต Frontend ให้เรียก `/api/user-location` ก่อนดึงโฆษณา

---

## ข้อดีของวิธีนี้

1. **รองรับ GPS ที่ไม่แม่นยำ**: ถ้า GPS ไม่ตก geometry ก็หาตำบลที่ใกล้ที่สุดแทน
2. **รองรับ 52 ตำบลที่ไม่มี geometry**: ใช้ distance จากตำบลข้างเคียง
3. **Flexible**: สามารถกำหนดโฆษณาได้หลายระดับ (ตำบล/อำเภอ/จังหวัด/ทั่วประเทศ)
4. **Prioritized**: โฆษณาที่เจาะจงกว่าจะแสดงก่อน (tambon > amphure > province > nationwide)

---

## ทดสอบการใช้งาน

```bash
# 1. หาตำบลของ user
curl "http://localhost:3000/api/user-location?lat=13.7563&lng=100.5018"

# 2. ดึงร้านค้าใกล้เคียง
curl "http://localhost:3000/api/shops?lat=13.7563&lng=100.5018&limit=20"

# 3. ดึงโฆษณาที่เหมาะสม (ใช้ tambon_id ที่ได้จากข้อ 1)
curl "http://localhost:3000/api/banners?tambon_id=123&amphure_id=45&province_id=1"
```
