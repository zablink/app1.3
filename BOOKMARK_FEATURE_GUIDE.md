# คู่มือการใช้งาน Bookmark System

## 📋 ภาพรวม

ระบบ Bookmark ช่วยให้ผู้ใช้สามารถบันทึกร้านค้าที่สนใจ และดูตำแหน่งร้านบนแผนที่พร้อมคำนวณระยะทาง สะดวกสำหรับการวางแผนท่องเที่ยวหรือหาร้านอาหารในพื้นที่ที่ต้องการไป

## 🎯 ฟีเจอร์หลัก

### 1. บันทึกร้านค้า (Bookmark)
- กดปุ่มหัวใจเพื่อบันทึกร้าน
- รองรับการเพิ่ม notes (บันทึกส่วนตัว) และ tags (แท็กจัดหมวดหมู่)
- ลบร้านออกจาก bookmark ได้ตลอดเวลา

### 2. แสดงบนแผนที่ (Map View)
- ใช้ **Leaflet + OpenStreetMap** (ฟรี 100%)
- แสดงร้านทั้งหมดที่ bookmark ไว้
- คำนวณระยะทางจากตำแหน่งปัจจุบัน
- เรียงร้านตามระยะทางใกล้ที่สุด

### 3. นำทางด้วย Google Maps
- คลิก "นำทาง" เพื่อเปิด Google Maps
- รองรับทั้ง Desktop และ Mobile
- ส่งพิกัดโดยตรงไปยัง Google Maps สำหรับนำทาง

## 📂 โครงสร้างไฟล์

```
prisma/
  ├── schema.prisma              # เพิ่ม UserBookmark model
  └── migrations/
      └── 20241126_user_bookmarks/
          └── migration.sql      # สร้างตาราง user_bookmarks

src/
  ├── app/
  │   ├── api/
  │   │   └── user/
  │   │       └── bookmarks/
  │   │           ├── route.ts            # GET, POST bookmarks
  │   │           └── [shopId]/
  │   │               └── route.ts        # GET, PATCH, DELETE bookmark
  │   └── bookmarks/
  │       └── page.tsx                    # หน้า Bookmarks พร้อม Map View
  │
  ├── components/
  │   ├── BookmarkButton.tsx              # ปุ่ม Bookmark พร้อม animation
  │   └── BookmarkMapView.tsx             # แผนที่แสดงร้าน bookmark
  │
  └── hooks/
      └── useBookmark.ts                  # Hook จัดการ bookmark
```

## 🗄️ Database Schema

```prisma
model UserBookmark {
  id           String   @id @default(cuid())
  userId       String   
  shopId       String   
  notes        String?  // บันทึกส่วนตัว
  tags         String[] // tags สำหรับจัดหมวดหมู่
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user         User     @relation(...)
  shop         Shop     @relation(...)
  
  @@unique([userId, shopId])
  @@index([userId])
  @@index([shopId])
}
```

## 🔌 API Endpoints

### 1. GET /api/user/bookmarks
ดึงรายการ bookmarks ทั้งหมดของผู้ใช้

**Response:**
```json
{
  "bookmarks": [
    {
      "id": "shop_123",
      "name": "ร้านข้าวผัดอร่อย",
      "category": "อาหารตามสั่ง",
      "image": "/images/shop.jpg",
      "rating": 4.5,
      "reviewCount": 120,
      "address": "123 ถนนสุขุมวิท...",
      "lat": 13.7563,
      "lng": 100.5018,
      "bookmarkedAt": "2024-11-26T10:30:00Z",
      "notes": "อยากลองเมนูผัดกะเพรา",
      "tags": ["favorite", "must_try"]
    }
  ],
  "total": 15
}
```

### 2. POST /api/user/bookmarks
เพิ่มร้านเข้า bookmark

**Request:**
```json
{
  "shopId": "shop_123",
  "notes": "อยากมาลอง",
  "tags": ["favorite"]
}
```

### 3. DELETE /api/user/bookmarks/[shopId]
ลบร้านออกจาก bookmark

### 4. PATCH /api/user/bookmarks/[shopId]
อัปเดต notes หรือ tags

**Request:**
```json
{
  "notes": "มาลองแล้ว อร่อยมาก!",
  "tags": ["favorite", "visited"]
}
```

### 5. GET /api/user/bookmarks/[shopId]
ตรวจสอบว่า bookmark ร้านนี้หรือยัง

**Response:**
```json
{
  "isBookmarked": true,
  "bookmark": {
    "notes": "...",
    "tags": ["..."]
  }
}
```

## 💻 การใช้งาน Components

### BookmarkButton Component

```tsx
import BookmarkButton from "@/components/BookmarkButton";

// ใช้ในหน้ารายละเอียดร้าน
<BookmarkButton 
  shopId="shop_123"
  size="md"           // sm, md, lg
  showLabel={true}    // แสดง label "บันทึก"
/>
```

### useBookmark Hook

```tsx
import { useBookmark } from "@/hooks/useBookmark";

function ShopCard({ shopId }) {
  const { 
    isBookmarked, 
    isLoading, 
    toggleBookmark,
    updateBookmark 
  } = useBookmark(shopId);

  return (
    <button onClick={() => toggleBookmark("บันทึกส่วนตัว", ["favorite"])}>
      {isBookmarked ? "❤️ บันทึกแล้ว" : "🤍 บันทึก"}
    </button>
  );
}
```

## 🗺️ Map View Features

### 1. แสดงร้านบนแผนที่
- ใช้ Leaflet (OpenStreetMap) - ฟรี ไม่ต้องใช้ API key
- แสดง marker แต่ละร้านพร้อมไอคอน
- คลิก marker เพื่อดูรายละเอียด

### 2. คำนวณระยะทาง
- ใช้ **Haversine formula** คำนวณระยะทางแม่นยำ
- แสดงระยะทางเป็นกิโลเมตร
- เรียงร้านตามระยะใกล้ที่สุด

### 3. ตำแหน่งผู้ใช้
- ขออนุญาตเข้าถึง Geolocation
- แสดง marker สีน้ำเงินพร้อม animation pulse
- ปรับ bounds ให้เห็นทั้งตำแหน่งผู้ใช้และร้านทั้งหมด

### 4. นำทางด้วย Google Maps
```tsx
// เปิด Google Maps สำหรับนำทาง
window.open(
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  '_blank'
);
```

## 🎨 UI/UX Features

### 1. View Modes
- **List View**: แสดงเป็น grid cards
- **Map View**: แสดงบนแผนที่

### 2. Filters (List View)
- ทั้งหมด
- ล่าสุด (เรียงตาม bookmarkedAt)
- คะแนนสูงสุด (เรียงตาม rating)

### 3. Responsive Design
- Mobile-friendly
- ปรับ layout ตามขนาดหน้าจอ
- Touch-friendly สำหรับ mobile

## 🚀 วิธีติดตั้ง

### 1. Run Migration
```bash
npx prisma migrate dev --name user_bookmarks
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. ติดตั้ง Dependencies (ถ้ายังไม่มี)
```bash
npm install leaflet
npm install -D @types/leaflet
```

### 4. เพิ่ม Leaflet CSS ใน layout
```tsx
// ใน src/app/layout.tsx หรือใช้ใน component
import 'leaflet/dist/leaflet.css';
```

## 🔧 Configuration

### Leaflet Map Options

```tsx
// ใน BookmarkMapView.tsx
const map = L.map("bookmark-map").setView([centerLat, centerLng], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
}).addTo(map);
```

### Custom Marker Icons

```tsx
const customIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
      🍴
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
```

## 📱 Use Cases

### 1. การท่องเที่ยว
- บันทึกร้านที่อยากไปในแต่ละจังหวัด
- เมื่อไปถึงจังหวัดนั้น เปิด Map View
- ดูว่าร้านไหนอยู่ใกล้ที่สุด
- คลิกนำทางด้วย Google Maps

### 2. รีวิวเวอร์/Food Blogger
- บันทึกร้านที่จะไปรีวิว
- ใส่ notes เตือนตัวเอง เช่น "ต้องลองเมนู X"
- เพิ่ม tags เช่น "pending_review", "must_try"
- วางแผนเส้นทางด้วย Map View

### 3. คนท้องถิ่น
- บันทึกร้านโปรดในพื้นที่
- แบ่งหมวดหมู่ด้วย tags
- แนะนำเพื่อนที่มาเที่ยว

## 🌟 Map Library Comparison

| Library | ราคา | Features | ข้อดี | ข้อเสีย |
|---------|------|----------|-------|---------|
| **Leaflet + OSM** | ฟรี 100% | แสดง marker, popup, geolocation | ไม่ต้องใช้ API key, ไม่จำกัดการใช้งาน | ไม่มี Street View |
| Google Maps | ฟรี $200/เดือน* | Street View, rich features | Feature ครบ | ต้องใช้ API key, มี quota |
| Mapbox | ฟรี 50,000 views/เดือน | สวยงาม, custom styles | Design สวย | ต้องใช้ API key |

**คำแนะนำ**: ใช้ **Leaflet + OpenStreetMap** สำหรับแสดงแผนที่ใน app และใช้ **Google Maps** สำหรับนำทางเท่านั้น (ไม่มี quota)

## 🐛 Troubleshooting

### 1. Leaflet CSS ไม่โหลด
```tsx
// ใช้ dynamic import
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/BookmarkMapView'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});
```

### 2. Geolocation ไม่ทำงาน
- ตรวจสอบว่าเปิดใช้งาน HTTPS
- ขออนุญาตใน browser settings
- ทดสอบบน localhost ได้ปกติ

### 3. Migration Error
```bash
# Reset และ run ใหม่
npx prisma migrate reset
npx prisma migrate dev
```

## 📈 Future Enhancements

1. **Offline Maps**: รองรับ PWA + offline map tiles
2. **Share Bookmark List**: แชร์รายการร้านให้เพื่อน
3. **Route Planning**: วางเส้นทางหลายร้านพร้อมกัน
4. **Push Notifications**: แจ้งเตือนเมื่ออยู่ใกล้ร้านที่ bookmark
5. **Clustering**: จัดกลุ่ม markers เมื่อ zoom out
6. **Heatmap**: แสดง heatmap ร้านที่ได้รับความนิยม

## 📞 Support

หากมีปัญหาหรือข้อสงสัย สามารถตรวจสอบได้ที่:
- Console errors
- Network tab (API calls)
- Prisma Studio: `npx prisma studio`

---

**สร้างโดย**: Zablink Development Team  
**วันที่**: 26 พฤศจิกายน 2024  
**เวอร์ชัน**: 1.0.0
