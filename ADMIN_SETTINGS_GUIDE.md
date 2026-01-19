# Admin Settings & Hero Banners System

## 📋 สรุประบบที่สร้าง

ระบบจัดการ Settings และ Hero Banners สำหรับ Admin ที่ครบถ้วน พร้อมใช้งาน

---

## 🗂️ ไฟล์ที่สร้างและแก้ไข

### 1. Database Schema
- **`prisma/schema.prisma`** - เพิ่ม Models:
  - `SiteSetting` - การตั้งค่าเว็บไซต์
  - `SiteSettingHistory` - ประวัติการแก้ไข
  - `HeroBanner` - Hero Banners

### 2. API Routes
- **`src/app/api/admin/banners/route.ts`** - GET/POST banners
- **`src/app/api/admin/banners/[id]/route.ts`** - GET/PUT/DELETE banner ตาม ID
- **`src/app/api/admin/settings/bulk/route.ts`** - Bulk update settings
- **`src/app/api/banners/route.ts`** - Public API ดึง active banners

### 3. Admin Pages
- **`src/app/admin/settings/page.tsx`** - หน้าจัดการ Settings และ Banners (ใหม่)

### 4. Frontend Pages
- **`src/app/page.tsx`** - อัปเดตให้ดึง banners จาก database พร้อม auto-rotate

### 5. Database Migration
- **`prisma/migrations/20241119_site_settings_banners/migration.sql`** - สร้างตารางและข้อมูลเริ่มต้น

---

## 🚀 วิธีใช้งาน

### 1. รัน Migration
```bash
cd /Users/Over-Data/WEB/WEB-Projects/zablink/app1.3
npx prisma migrate dev
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. เข้าสู่หน้า Admin Settings
```
http://localhost:3000/admin/settings
```

---

## 🎨 ฟีเจอร์ที่มี

### Hero Banners Management
- ✅ เพิ่ม/แก้ไข/ลบ Hero Banners
- ✅ อัปโหลดรูปภาพ
- ✅ กำหนดลำดับแสดงผล (Priority)
- ✅ เปิด/ปิดการแสดงผล
- ✅ กำหนดช่วงวันที่แสดง (Start/End Date)
- ✅ กำหนด CTA Button (Label + Link)
- ✅ Auto-rotate banners ทุก 5 วินาที (หน้า Home)
- ✅ Banner indicators (จุดเลื่อน)

### Site Settings Management
- ✅ แบ่งตาม Categories (Branding, SEO, Site, Features)
- ✅ รองรับ Data Types หลากหลาย:
  - String
  - Image (พร้อมอัปโหลด)
  - Color (Color Picker)
  - Boolean (Checkbox)
  - JSON (Textarea)
- ✅ Track การเปลี่ยนแปลง
- ✅ Bulk Update
- ✅ บันทึกประวัติการแก้ไข

---

## 📊 ตัวอย่าง Default Data

### Hero Banners
1. **ยินดีต้อนรับสู่ Zablink** (Priority: 100)
2. **ค้นพบร้านอาหารใกล้คุณ** (Priority: 90)
3. **ลงทะเบียนร้านค้าของคุณ** (Priority: 80)

### Site Settings
- **Branding**: Site Name, Logo, Favicon, Primary Color
- **SEO**: Title, Description, Keywords, OG Image
- **Site**: Contact Email, Phone, Facebook, LINE
- **Features**: Enable Reviews, Bookmarks, Max Upload Size

---

## 🔐 การใช้งาน API

### Public API
```typescript
// ดึง Active Banners
GET /api/banners
Response: { success: true, banners: [...] }
```

### Admin API (ต้อง Login เป็น ADMIN)
```typescript
// ดึง Banners ทั้งหมด
GET /api/admin/banners

// สร้าง Banner ใหม่
POST /api/admin/banners
Body: {
  title: string,
  subtitle?: string,
  ctaLabel?: string,
  ctaLink?: string,
  imageUrl: string,
  priority?: number,
  isActive?: boolean,
  startDate?: string,
  endDate?: string
}

// อัปเดต Banner
PUT /api/admin/banners/[id]

// ลบ Banner
DELETE /api/admin/banners/[id]

// Bulk Update Settings
POST /api/admin/settings/bulk
Body: {
  updates: [{ key: string, value: any }],
  reason?: string
}
```

---

## 🎯 การใช้งานในหน้า Frontend

```typescript
import Hero from '@/components/Hero';

// ดึง banners จาก API
const [banners, setBanners] = useState([]);

useEffect(() => {
  fetch('/api/banners')
    .then(res => res.json())
    .then(data => setBanners(data.banners));
}, []);

// แสดง Hero Banner
<Hero 
  title={banners[0]?.title}
  subtitle={banners[0]?.subtitle}
  ctaLabel={banners[0]?.ctaLabel}
  onCtaClick={() => router.push(banners[0]?.ctaLink)}
  backgroundImage={banners[0]?.imageUrl}
/>
```

---

## 📝 TODO ต่อไป

- [ ] เพิ่ม Rich Text Editor สำหรับ Subtitle
- [ ] เพิ่ม Analytics tracking สำหรับ Banner clicks
- [ ] เพิ่ม A/B Testing สำหรับ Banners
- [ ] เพิ่ม Banner Templates
- [ ] เพิ่ม Drag & Drop สำหรับจัดลำดับ
- [ ] Export/Import Settings เป็น JSON

---

## 🛠️ Troubleshooting

### ปัญหา: ไม่เห็น Banners
- ตรวจสอบว่า `isActive = true`
- ตรวจสอบช่วงวันที่ (startDate/endDate)
- เช็ค Console สำหรับ Error

### ปัญหา: อัปโหลดรูปไม่ได้
- ตรวจสอบ `/api/upload` endpoint
- เช็คขนาดไฟล์ (ต้องไม่เกิน max_upload_size)

### ปัญหา: Settings ไม่ Update
- ตรวจสอบว่า Login เป็น ADMIN
- เช็ค Network tab สำหรับ API errors

---

## 📚 เอกสารเพิ่มเติม

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [NextAuth.js](https://next-auth.js.org/)

---

สร้างเมื่อ: 19 พฤศจิกายน 2025
