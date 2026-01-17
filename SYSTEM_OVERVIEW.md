# สรุปภาพรวมระบบ Zablink - Food & Creator Platform

## 🎯 ภาพรวมระบบ

**Zablink** เป็นแพลตฟอร์มเชื่อมต่อร้านอาหาร นักรีวิว (Creators) และผู้ใช้งาน โดยมีระบบสมัครสมาชิก การจัดการร้านค้า ระบบโฆษณา และระบบแคมเปญรีวิว

---

## 🏗️ สถาปัตยกรรมระบบ

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js (JWT)
- **Storage:** Supabase (สำหรับรูปภาพ)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Payment:** Omise
- **Maps:** Leaflet (สำหรับแผนที่)

---

## 📁 โครงสร้างโปรเจกต์

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API Routes (route.ts)
│   │   ├── admin/         # Admin APIs
│   │   ├── auth/          # Authentication
│   │   ├── shops/         # Shop management
│   │   ├── creators/      # Creator management
│   │   ├── campaigns/     # Campaign system
│   │   ├── analytics/     # Analytics tracking
│   │   └── ...
│   ├── admin/             # Admin UI pages
│   ├── shop/              # Shop UI pages
│   ├── dashboard/         # User dashboards
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities & services
│   ├── auth.ts           # Auth configuration
│   ├── prisma.ts         # Database client
│   ├── supabase.ts       # Storage client
│   └── ...
└── utils/                 # Helper functions
```

---

## 🔐 ระบบ Authentication & Authorization

### Authentication Methods
1. **Email & Password** (Credentials)
2. **Google OAuth**
3. **Facebook OAuth**
4. **X (Twitter) OAuth**
5. **Phone OTP** (เตรียมไว้ แต่ยังไม่เปิดใช้งาน)

### User Roles
```typescript
enum Role {
  USER        // ผู้ใช้ทั่วไป
  SHOP        // เจ้าของร้าน
  CREATOR     // นักรีวิว/Content Creator
  MCN_MANAGER // ผู้จัดการ MCN
  AD_MANAGER  // ผู้จัดการโฆษณา
  ADMIN       // ผู้ดูแลระบบ
}
```

### Authorization Functions
- `requireAuth()` - ต้อง login
- `requireRole(['ADMIN'])` - ต้องมี role ที่กำหนด
- `requireAdmin()` - ต้องเป็น admin
- `requireShopOwner()` - ต้องเป็นเจ้าของร้าน
- `requireOwnerOrAdmin()` - ต้องเป็นเจ้าของร้านหรือ admin

---

## 🗄️ Database Schema (หลัก)

### Core Models

#### 1. User
- ข้อมูลผู้ใช้พื้นฐาน
- Role-based access control
- เชื่อมโยงกับ Shop, Bookmark

#### 2. Shop
- ข้อมูลร้านค้า
- Location (PostGIS geometry)
- Subscription tier
- Status: PENDING, APPROVED, REJECTED, SUSPENDED
- Links: LineMan, GrabFood, FoodPanda, Shopee
- Gallery, Hours, Categories

#### 3. ShopCategory & ShopCategoryMapping
- หมวดหมู่ร้านค้า (Many-to-Many)
- Icon, Description

#### 4. SubscriptionPackage & ShopSubscription
- แพ็กเกจสมัครสมาชิก (FREE, BASIC, PRO, PREMIUM)
- Features: max_images, max_menu_items, analytics, etc.
- Auto-renewal support

#### 5. TokenWallet
- ระบบ Token สำหรับร้านค้า
- ใช้สำหรับจ่าย Creator

#### 6. Creator (creators table)
- ข้อมูล Content Creator/Reviewer
- Social media links (YouTube, Facebook, Instagram, TikTok)
- Price range (min/max)
- Coverage areas
- Earnings, Withdrawals

#### 7. Campaigns & Campaign Jobs
- ร้านค้าสร้างแคมเปญรีวิว
- Creator รับงานและส่งผลงาน
- Status: DRAFT, PENDING, IN_PROGRESS, COMPLETED, etc.

#### 8. Analytics Models
- `PageView` - การเข้าชมหน้าเว็บ
- `ShopView` - การดูร้านค้า
- `UserSession` - Session tracking
- `Event` - Custom events (call, share, bookmark)
- `ConversionFunnel` - Conversion tracking
- `DailyStats` - สถิติรายวัน

#### 9. AdBanner & AdImpression
- ระบบโฆษณา
- Location-based targeting
- Placement: hero, sidebar, category_top, etc.

#### 10. UserBookmark
- ระบบ bookmark ร้านค้า
- Tags, Notes

---

## 🎨 Frontend Architecture

### Page Structure

#### 1. Homepage (`/`)
- **Features:**
  - Hero Banner (auto-rotate)
  - Location-based shop sorting
  - Infinite scroll
  - Group shops by subscription tier (PREMIUM, PRO, BASIC, FREE)
  - Geolocation integration

#### 2. Shop Pages
- `/shop/[shopId]` - หน้าแสดงร้านค้า
- `/shop/register` - สมัครร้านค้า
- `/shop/edit/[shopId]` - แก้ไขร้านค้า

#### 3. Admin Pages
- `/admin/dashboard` - Dashboard หลัก
- `/admin/shops` - จัดการร้านค้า (approve, reject, bulk actions)
- `/admin/creators` - จัดการ Creators
- `/admin/categories` - จัดการหมวดหมู่
- `/admin/settings` - ตั้งค่าระบบ

#### 4. Dashboard Pages
- `/dashboard/shop` - Dashboard เจ้าของร้าน
- `/dashboard/creator` - Dashboard Creator

#### 5. Category Pages
- `/categories` - รายการหมวดหมู่
- `/category/[slug]` - ร้านค้าในหมวดหมู่

### Component Structure

#### Layout Components
- `Navbar` - Navigation bar
- `UserMenu` - User dropdown menu

#### Shop Components
- `ShopCard` - Card แสดงร้านค้า
- `ShopGalleryManager` - จัดการรูปภาพ
- `ShopLinksManager` - จัดการลิงก์
- `MapPicker` - เลือกตำแหน่งบนแผนที่

#### Location Components
- `LocationPicker` - เลือกตำแหน่ง
- `GPSButton` - ใช้ GPS
- `LocationModal` - Modal เลือกตำแหน่ง

#### Other Components
- `Hero` - Hero banner
- `BookmarkButton` - ปุ่ม bookmark
- `AdBanner` - แสดงโฆษณา
- `Notification` - Toast notification

---

## 🔧 Backend API Architecture

### API Route Structure
ทุก API route อยู่ใน `/api` และใช้ `route.ts` (Next.js App Router)

### Main API Groups

#### 1. Authentication APIs (`/api/auth/`)
- `[...nextauth]/route.ts` - NextAuth handler
- `register/route.ts` - สมัครสมาชิก

#### 2. Shop APIs (`/api/shops/`)
- `GET /api/shops` - ดึงรายการร้านค้า
  - Query params: `lat`, `lng`, `limit`, `offset`, `sortBy`
  - Location-based sorting (PostGIS)
  - Filter by status, subscription tier
- `GET /api/shops/[shopId]` - ดึงข้อมูลร้านค้า
- `POST /api/shops/register` - สมัครร้านค้า
- `GET /api/shops/my-shop` - ร้านค้าของฉัน

#### 3. Admin APIs (`/api/admin/`)
- `/api/admin/shops/` - จัดการร้านค้า
  - `POST /approve` - อนุมัติร้าน
  - `POST /decline` - ปฏิเสธร้าน
  - `POST /assign-package` - กำหนดแพ็กเกจ
  - `POST /bulk-*` - Bulk actions
- `/api/admin/creators/` - จัดการ Creators
  - `POST /[id]/approve` - อนุมัติ Creator
  - `POST /[id]/reject` - ปฏิเสธ Creator
  - `POST /[id]/update-pricing` - แก้ไขราคา
- `/api/admin/settings/` - ตั้งค่าระบบ
- `/api/admin/dashboard/` - Dashboard data

#### 4. Creator APIs (`/api/creator/`)
- `POST /register` - สมัครเป็น Creator
- `GET /profile` - ข้อมูล Creator

#### 5. Campaign APIs (`/api/campaigns/`)
- `GET /api/campaigns/[id]` - ข้อมูลแคมเปญ
- `POST /api/campaign-jobs/[id]/accept` - Creator รับงาน
- `POST /api/campaign-jobs/[id]/submit` - ส่งผลงาน

#### 6. Analytics APIs (`/api/analytics/`)
- `POST /page-view` - บันทึกการเข้าชมหน้า
- `POST /shop-view` - บันทึกการดูร้านค้า
- `POST /event` - บันทึก custom event
- `POST /session` - สร้าง/อัปเดต session
- `GET /stats` - ดึงสถิติ

#### 7. Location APIs (`/api/location/`)
- `GET /provinces` - ดึงจังหวัด
- `GET /amphures` - ดึงอำเภอ
- `GET /tambons` - ดึงตำบล
- `POST /reverse-geocode` - แปลง lat/lng เป็นที่อยู่

#### 8. Upload APIs (`/api/upload/`)
- `POST /upload` - อัปโหลดรูปภาพ (Supabase)
- `POST /base64` - อัปโหลดจาก base64

#### 9. Subscription APIs (`/api/subscriptions/`)
- `GET /subscription-plans` - แพ็กเกจทั้งหมด
- `POST /subscriptions` - สมัครสมาชิก

#### 10. Payment APIs (`/api/payment/`)
- `POST /omise/create-charge` - สร้าง charge
- `POST /omise/webhook` - Webhook จาก Omise

---

## 🔄 Business Logic Flow

### 1. Shop Registration Flow
```
User สมัครร้าน
  ↓
POST /api/shops/register
  ↓
สร้าง Shop (status: PENDING)
  ↓
Admin ตรวจสอบ
  ↓
Admin อนุมัติ/ปฏิเสธ
  ↓
Shop status: APPROVED/REJECTED
```

### 2. Creator Application Flow
```
User สมัครเป็น Creator
  ↓
POST /api/creator/register
  ↓
สร้าง Creator record (status: PENDING)
  ↓
Admin ตรวจสอบและอนุมัติ
  ↓
กำหนดราคา (priceMin, priceMax)
  ↓
Creator status: APPROVED
```

### 3. Campaign Flow
```
Shop สร้าง Campaign
  ↓
กำหนด budget, target reviewers
  ↓
Creators เห็นและรับงาน
  ↓
Creator ทำงาน (review)
  ↓
Creator ส่งผลงาน
  ↓
Shop ตรวจสอบและอนุมัติ
  ↓
จ่าย Token ให้ Creator
```

### 4. Subscription Flow
```
Shop เลือกแพ็กเกจ
  ↓
ชำระเงิน (Omise)
  ↓
สร้าง ShopSubscription
  ↓
Shop ได้ features ตามแพ็กเกจ
  ↓
Auto-renewal (ถ้าเปิด)
```

### 5. Location-Based Shop Discovery
```
User เปิดหน้าแรก
  ↓
ขอ Geolocation permission
  ↓
ส่ง lat/lng ไป API
  ↓
API คำนวณระยะทาง (PostGIS)
  ↓
เรียงลำดับร้านตามระยะทาง
  ↓
แสดงร้านใกล้เคียงก่อน
```

### 6. Analytics Tracking Flow
```
User เข้าชมหน้า
  ↓
Client ส่ง event ไป /api/analytics/page-view
  ↓
บันทึก PageView
  ↓
User ดูร้านค้า
  ↓
Client ส่ง event ไป /api/analytics/shop-view
  ↓
บันทึก ShopView
  ↓
User ทำ action (call, share, bookmark)
  ↓
Client ส่ง event ไป /api/analytics/event
  ↓
บันทึก Event
```

---

## 🎯 Key Features

### 1. Subscription Tiers
- **FREE:** พื้นฐาน
- **BASIC:** เพิ่มรูปภาพ, เมนู, ลิงก์
- **PRO:** Advanced analytics, verified badge
- **PREMIUM:** สูงสุด, pin on map, priority display

### 2. Location-Based Features
- PostGIS สำหรับคำนวณระยะทาง
- Location-based ad targeting
- Shop filtering by province/amphure/tambon

### 3. Creator Management
- Creator application & approval
- Price management
- Campaign job assignment
- Earnings & withdrawal tracking

### 4. Analytics System
- Google Analytics integration
- Custom analytics (page views, shop views, events)
- Conversion funnel tracking
- Daily stats aggregation

### 5. Ad System
- Location-based targeting
- Multiple placements (hero, sidebar, etc.)
- Impression & click tracking

### 6. Bookmark System
- User bookmarks shops
- Tags & notes
- Shared bookmarks

---

## 🔒 Security & Validation

### Authentication
- JWT-based sessions (NextAuth)
- Password hashing (bcrypt)
- OAuth providers

### Authorization
- Role-based access control
- Shop ownership verification
- API route protection

### Data Validation
- Zod schemas (บางส่วน)
- Prisma type safety
- Input sanitization

---

## 📊 Performance Optimizations

### Frontend
- Infinite scroll (ลด initial load)
- Image lazy loading
- Debounced scroll events
- Pagination

### Backend
- Database indexes (location, status, dates)
- PostGIS spatial indexes
- Query optimization
- Connection pooling (Prisma)

---

## 🚀 Deployment

### Build Process
```bash
npm run build
# - Prisma generate
# - Next.js build
# - Route conflict checks
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Auth secret
- `GOOGLE_CLIENT_ID/SECRET` - OAuth
- `SUPABASE_URL/KEY` - Storage
- `OMISE_*` - Payment

---

## 📝 Notes

### Important Conventions
1. **Route Structure:** `route.ts` ต้องอยู่ใน `/api` เท่านั้น
2. **Naming:** ตาม NAMING_STANDARDS.md
3. **Pre-commit hooks:** ตรวจสอบ route conflicts อัตโนมัติ

### Known Limitations
- Phone OAuth ยังไม่เปิดใช้งาน
- Some features may be in development

---

## 🔗 Related Documentation

- `DEVELOPMENT_SETUP.md` - Setup guide
- `ROUTE_STRUCTURE_GUIDE.md` - Route conventions
- `CREATOR_MANAGEMENT_GUIDE.md` - Creator system
- `ANALYTICS_SYSTEM_GUIDE.md` - Analytics system
- `ADMIN_SETTINGS_GUIDE.md` - Admin dashboard

---

**Last Updated:** 2025-01-XX
**Version:** 1.3.2
