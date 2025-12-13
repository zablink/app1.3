# Shop Loading Solution

## Problem Summary (สรุปปัญหา)

ระบบมี API endpoint `/api/shops` ที่สามารถค้นหาร้านค้าตามตำแหน่ง (GPS) ได้อยู่แล้ว แต่ไม่มีหน้าไหนเรียกใช้งาน API นี้เลย ทำให้ร้านค้าไม่ถูกโหลดจาก API

## Solution (วิธีแก้ไข)

สร้างหน้า `/shops` ใหม่ที่เรียกใช้งาน API `/api/shops` จริงๆ พร้อมฟีเจอร์:

### Features Implemented

1. **Location-Based Shop Loading (โหลดร้านตามตำแหน่ง)**
   - รองรับการหาตำแหน่งอัตโนมัติด้วย Geolocation API
   - รองรับการระบุพิกัดด้วยตนเอง (Latitude, Longitude)

2. **Loading States (สถานะการโหลด)**
   - แสดง loading spinner ขณะกำลังค้นหา
   - แสดงข้อความเมื่อไม่พบร้าน
   - แสดง error message เมื่อเกิดข้อผิดพลาด

3. **Shop Display (การแสดงผลร้าน)**
   - แสดงชื่อร้าน
   - แสดงระยะทาง (กิโลเมตร)
   - แสดง package type (Pro1, Pro2, Pro3, Free)
   - แสดงที่อยู่ (ตำบล, อำเภอ, จังหวัด)

4. **Navigation (การนำทาง)**
   - เพิ่มลิงก์ "ร้านค้า" ในเมนูหลักทุก role (guest, user, shop, admin)
   - คลิกที่ร้านแล้วไปหน้ารายละเอียดร้าน

## How to Use (วิธีใช้งาน)

### For End Users (สำหรับผู้ใช้งาน)

1. เข้าสู่หน้า `/shops` หรือคลิกเมนู "ร้านค้า"
2. เลือกวิธีการหาตำแหน่ง:
   - **📍 ใช้ตำแหน่งปัจจุบัน** - ให้เบราว์เซอร์หาตำแหน่งอัตโนมัติ
   - **🗺️ ระบุตำแหน่งเอง** - กรอก Latitude และ Longitude เอง
3. ระบบจะค้นหาร้านที่อยู่ใกล้คุณภายในรัศมี 10 กิโลเมตร
4. คลิกที่ร้านเพื่อดูรายละเอียด

### For Developers (สำหรับนักพัฒนา)

#### API Endpoint
```
GET /api/shops?lat={latitude}&lng={longitude}
```

**Parameters:**
- `lat` (required): Latitude ของตำแหน่ง
- `lng` (required): Longitude ของตำแหน่ง
- `subdistrict` (optional): ชื่อตำบล (ถ้าไม่มีร้านในระยะ 10 กม.)
- `district` (optional): ชื่ออำเภอ
- `province` (optional): ชื่อจังหวัด

**Response:**
```json
[
  {
    "id": "1",
    "name": "Test Shop A",
    "latitude": 13.7563,
    "longitude": 100.5018,
    "packageType": "pro1",
    "province": "Bangkok",
    "distance": 0
  }
]
```

#### Testing the API

```bash
# Test with Bangkok coordinates
curl "http://localhost:3000/api/shops?lat=13.7563&lng=100.5018"

# Expected: Returns shops within 10km, sorted by package type and distance
```

## Files Changed

1. **New File: `/src/app/shops/page.tsx`**
   - Main shop listing page component
   - Integrates with `/api/shops` API
   - Handles geolocation and manual input

2. **Modified: `/src/components/AppLayout.tsx`**
   - Added "ร้านค้า" navigation link for all user roles

## Technical Details

### API Logic (from `/api/shops/route.ts`)

1. **Distance-based search (10km radius)**
   - Uses Haversine formula to calculate distance
   - Filters shops within 10km

2. **Fallback hierarchy**
   - If no shops within 10km → search by subdistrict
   - If no shops in subdistrict → search by district
   - If no shops in district → search by province

3. **Sorting**
   - Primary: Package type (Special > Pro3 > Pro2 > Pro1 > Free)
   - Secondary: Distance (nearest first)

### Mock Data

Currently using mock data with 2 test shops in Bangkok:
- Test Shop A (Pro1 package)
- Test Shop B (Free package)

**Note:** Replace mock data with real database queries when ready.

## Future Improvements

- [ ] Connect to real database (currently using mock data)
- [ ] Add map visualization
- [ ] Add filters (category, package type)
- [ ] Add search functionality
- [ ] Cache results for better performance
- [ ] Add pagination for large result sets

## Recap (สรุป)

✅ **สร้างหน้า `/shops` ที่ทำงานได้แล้ว**
- โหลดร้านจาก API `/api/shops` (ใช้ mock data)
- รองรับการหาตำแหน่ง GPS และระบุเอง
- แสดงผลร้านพร้อมระยะทางและข้อมูล
- เพิ่มลิงก์ในเมนูหลักแล้ว

✅ **ทดสอบแล้วว่าใช้งานได้**
- API ตอบกลับข้อมูลถูกต้อง
- หน้าโหลดสำเร็จ (HTTP 200)
- ไม่มี error ในการ compile
