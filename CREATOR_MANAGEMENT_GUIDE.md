# คู่มือการจัดการ Creators (Reviewers)

## ภาพรวม

ระบบจัดการ Creators ถูกออกแบบมาเพื่อให้ Admin สามารถจัดการกับผู้สมัครเป็น Content Creator/Reviewer ได้อย่างสมบูรณ์ ครอบคลุมตั้งแต่การอนุมัติ การกำหนดราคา ไปจนถึงการติดตามผลงาน

## โครงสร้างหน้าและ API

### หน้าจัดการหลัก

#### 1. `/admin/creators` - รายการ Creators
**คุณสมบัติ:**
- แสดงรายการ Creators ทั้งหมด
- กรองตามสถานะ (PENDING, APPROVED, REJECTED, SUSPENDED)
- ค้นหาตามชื่อ, อีเมล
- แสดงสถิติแบบ Summary Cards
- Pagination

**ข้อมูลที่แสดง:**
- ชื่อ Creator และข้อมูลผู้ใช้
- ข้อมูลติดต่อ (อีเมล, เบอร์โทร)
- ช่วงราคา (ถ้ามี)
- สถิติ (รีวิว, คะแนน, รายได้)
- สถานะการสมัคร

#### 2. `/admin/creators/[id]` - รายละเอียด Creator
**แท็บต่างๆ:**

##### แท็บ "ข้อมูลทั่วไป"
- ข้อมูลส่วนตัว (ชื่อ, อีเมล, เบอร์โทร, ประวัติ)
- โซเชียลมีเดีย (YouTube, Facebook, Instagram, TikTok) พร้อมจำนวนผู้ติดตาม
- สถิติการทำงาน (รีวิวทั้งหมด, รีวิวที่เสร็จ, คะแนนเฉลี่ย, อัตราความสำเร็จ)
- ราคาปัจจุบัน พร้อมปุ่มแก้ไข

##### แท็บ "งานที่รับ"
- สถิติงาน (ทั้งหมด, เสร็จสิ้น, กำลังดำเนินการ, รอดำเนินการ)
- ตารางแสดงงานทั้งหมดที่ Creator รับ
- แสดงแคมเปญ, ร้านค้า, ราคา, สถานะ

##### แท็บ "ประวัติราคา"
- ตารางแสดงการเปลี่ยนแปลงราคาทั้งหมด
- แสดงช่วงราคา, วันที่มีผล, วันที่สิ้นสุด, เหตุผล

##### แท็บ "รายได้"
- รายได้ทั้งหมด
- ยอดคงเหลือ
- ยอดที่ถอนไปแล้ว

**การดำเนินการ:**
- อนุมัติ Creator (สำหรับสถานะ PENDING)
- ปฏิเสธ Creator (สำหรับสถานะ PENDING)
- แก้ไขราคา (สำหรับสถานะ APPROVED)

### API Endpoints

#### 1. `GET /admin/creators`
ดึงรายการ Creators พร้อม pagination และ filter

**Query Parameters:**
- `status` - กรองตามสถานะ (PENDING, APPROVED, REJECTED, SUSPENDED)
- `page` - หน้าที่ต้องการ (default: 1)
- `limit` - จำนวนรายการต่อหน้า (default: 20)

**Response:**
```json
{
  "creators": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### 2. `GET /admin/creators/[id]`
ดึงรายละเอียด Creator พร้อมข้อมูลที่เกี่ยวข้อง

**Response:**
```json
{
  "id": "...",
  "displayName": "...",
  "user": {...},
  "creator_price_history": [...],
  ...
}
```

#### 3. `POST /admin/creators/[id]/approve`
อนุมัติ Creator และกำหนดช่วงราคา

**Request Body:**
```json
{
  "priceMin": 500,
  "priceMax": 2000
}
```

**การทำงาน:**
- อัพเดทสถานะเป็น APPROVED
- บันทึกวันที่อนุมัติ
- กำหนดช่วงราคาเริ่มต้น
- สร้างประวัติราคาแรก

#### 4. `POST /admin/creators/[id]/reject`
ปฏิเสธ Creator

**Request Body:**
```json
{
  "reason": "เหตุผลในการปฏิเสธ (อย่างน้อย 10 ตัวอักษร)"
}
```

**การทำงาน:**
- อัพเดทสถานะเป็น REJECTED
- บันทึกวันที่ปฏิเสธ
- บันทึกเหตุผลการปฏิเสธ

#### 5. `POST /admin/creators/[id]/update-pricing`
อัพเดทช่วงราคาของ Creator

**Request Body:**
```json
{
  "newPriceMin": 800,
  "newPriceMax": 3000,
  "reason": "เหตุผล (ไม่บังคับ)"
}
```

**การทำงาน:**
- ปิดประวัติราคาเก่า (กำหนด effectiveTo)
- สร้างประวัติราคาใหม่
- อัพเดทราคาปัจจุบัน

#### 6. `GET /admin/creators/[id]/update-pricing`
ดึงประวัติการเปลี่ยนแปลงราคาทั้งหมด

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

#### 7. `GET /admin/creators/[id]/jobs`
ดึงรายการงานที่ Creator รับ

**Query Parameters:**
- `status` - กรองตามสถานะงาน
- `page` - หน้าที่ต้องการ
- `limit` - จำนวนรายการต่อหน้า

**Response:**
```json
{
  "jobs": [...],
  "pagination": {...},
  "stats": {
    "COMPLETED": 10,
    "IN_PROGRESS": 3,
    "PENDING": 2
  }
}
```

## Database Schema

### Model: creators
```prisma
model creators {
  id                    String   @id
  userId                String   @unique
  displayName           String
  bio                   String?
  phone                 String?
  
  // Social Media
  youtubeUrl            String?
  youtubeSubscribers    Int?
  facebookUrl           String?
  facebookFollowers     Int?
  instagramUrl          String?
  instagramFollowers    Int?
  tiktokUrl             String?
  tiktokFollowers       Int?
  
  // Stats
  totalReviews          Int      @default(0)
  completedReviews      Int      @default(0)
  rating                Float    @default(0.0)
  totalEarnings         Float    @default(0.0)
  availableBalance      Float    @default(0.0)
  totalWithdrawn        Float    @default(0.0)
  
  // Pricing
  currentPriceMin       Int?
  currentPriceMax       Int?
  
  // Application Status
  applicationStatus     String   @default("PENDING")
  rejectReason          String?
  appliedAt             DateTime @default(now())
  approvedAt            DateTime?
  rejectedAt            DateTime?
  
  // Relations
  creator_price_history creator_price_history[]
  campaign_jobs         campaign_jobs[]
  earnings              earnings[]
  withdrawals           withdrawals[]
}
```

### Model: creator_price_history
```prisma
model creator_price_history {
  id            String    @id
  creatorId     String
  priceMin      Int
  priceMax      Int
  effectiveFrom DateTime  @default(now())
  effectiveTo   DateTime?
  changedBy     String
  reason        String?
  createdAt     DateTime  @default(now())
  creators      creators  @relation(...)
}
```

## Workflow การอนุมัติ Creator

### 1. Creator สมัคร
- ผู้ใช้กรอกฟอร์มสมัครที่ `/creator/register`
- ระบบสร้าง record ใน `creators` table โดยมี `applicationStatus = "PENDING"`

### 2. Admin ตรวจสอบ
- เข้าไปที่ `/admin/creators`
- กรองเฉพาะสถานะ "รอดำเนินการ" (PENDING)
- คลิกดูรายละเอียด Creator

### 3. การอนุมัติ
- Admin คลิกปุ่ม "อนุมัติ"
- กำหนดช่วงราคา (ราคาต่ำสุด-สูงสุด)
- ระบบจะ:
  - เปลี่ยนสถานะเป็น APPROVED
  - บันทึกราคา
  - สร้างประวัติราคาแรก
  - (TODO: ส่งอีเมลแจ้งผู้สมัคร)

### 4. การปฏิเสธ
- Admin คลิกปุ่ม "ปฏิเสธ"
- ระบุเหตุผล (ขั้นต่ำ 10 ตัวอักษร)
- ระบบจะ:
  - เปลี่ยนสถานะเป็น REJECTED
  - บันทึกเหตุผล
  - (TODO: ส่งอีเมลแจ้งผู้สมัคร)

## การจัดการราคา

### การกำหนดราคาครั้งแรก
- เกิดขึ้นเมื่ออนุมัติ Creator
- Admin ระบุช่วงราคาที่เหมาะสม
- ระบบสร้างประวัติราคาแรกโดยอัตโนมัติ

### การเปลี่ยนราคา
- Admin สามารถแก้ไขราคาได้ทุกเมื่อ (สำหรับ Creator ที่ได้รับการอนุมัติ)
- ระบุช่วงราคาใหม่และเหตุผล (ไม่บังคับ)
- ระบบจะ:
  1. ปิดประวัติราคาเก่า (กำหนด `effectiveTo`)
  2. สร้างประวัติราคาใหม่
  3. อัพเดท `currentPriceMin` และ `currentPriceMax`

### ประวัติราคา
- เก็บประวัติการเปลี่ยนแปลงราคาทั้งหมด
- แสดงช่วงเวลาที่ราคามีผล
- บันทึกว่าใครเป็นคนเปลี่ยนและเพราะเหตุผลอะไร

## การติดตามงาน

### Jobs (งานที่รับ)
- ดูงานทั้งหมดที่ Creator รับ
- กรองตามสถานะงาน
- แสดงข้อมูล:
  - แคมเปญและร้านค้า
  - ราคาที่ตกลง
  - ค่าคอมมิชชั่น
  - รายได้ของ Creator
  - สถานะและวันที่

### รายได้
- รายได้ทั้งหมดที่ได้รับ
- ยอดคงเหลือที่สามารถถอนได้
- ยอดที่ถอนไปแล้ว

## สิทธิ์การเข้าถึง

### ต้องมีบทบาท ADMIN
ทุก API endpoint และหน้าจัดการต้องการสิทธิ์ ADMIN โดยใช้ฟังก์ชัน `requireAdmin()` ตรวจสอบ

```typescript
const { error, session } = await requireAdmin();
if (error) return error;
```

## TODO / ฟีเจอร์ที่ควรเพิ่มในอนาคต

1. **การแจ้งเตือน**
   - ส่งอีเมลแจ้งเมื่อได้รับการอนุมัติ/ปฏิเสธ
   - แจ้งเตือนเมื่อมีการเปลี่ยนราคา

2. **Dashboard สำหรับ Creator**
   - หน้าแสดงสถานะการสมัคร
   - ดูงานที่รับและรายได้

3. **การค้นหาขั้นสูง**
   - ค้นหาตามช่วงราคา
   - ค้นหาตามจำนวนผู้ติดตาม
   - ค้นหาตามคะแนน

4. **Export ข้อมูล**
   - Export รายชื่อ Creators เป็น CSV/Excel
   - Export รายงานรายได้

5. **Analytics**
   - กราฟแสดงจำนวน Creators แต่ละสถานะ
   - กราฟแสดงรายได้รวมของ Creators
   - กราฟแสดงจำนวนงานที่ทำเสร็จ

## การทดสอบ

### ทดสอบ API
```bash
# ดึงรายการ Creators
curl http://localhost:3000/admin/creators?status=PENDING

# ดูรายละเอียด Creator
curl http://localhost:3000/admin/creators/[id]

# อนุมัติ Creator
curl -X POST http://localhost:3000/admin/creators/[id]/approve \
  -H "Content-Type: application/json" \
  -d '{"priceMin": 500, "priceMax": 2000}'

# ดูงานที่รับ
curl http://localhost:3000/admin/creators/[id]/jobs
```

### ทดสอบ UI
1. เข้าสู่ระบบด้วยบัญชี ADMIN
2. ไปที่ `/admin/creators`
3. ทดสอบการกรอง, ค้นหา, pagination
4. คลิกดูรายละเอียด Creator
5. ทดสอบการอนุมัติ/ปฏิเสธ
6. ทดสอบการแก้ไขราคา

## ปัญหาที่อาจพบและวิธีแก้

### 1. Creator model ไม่พบ
**สาเหตุ:** ใช้ชื่อ model ผิด (ต้องใช้ `creators` ไม่ใช่ `creator`)

**วิธีแก้:**
```typescript
// ❌ ผิด
await prisma.creator.findMany()

// ✅ ถูกต้อง
await prisma.creators.findMany()
```

### 2. Relation name ไม่ถูกต้อง
**วิธีแก้:** ตรวจสอบ schema.prisma และใช้ชื่อ relation ให้ตรงกัน
```typescript
// schema.prisma
creator_price_history creator_price_history[]
campaign_jobs         campaign_jobs[]

// ใน code
include: {
  creator_price_history: true,
  campaign_jobs: true
}
```

### 3. ID generation error
**สาเหตุ:** ไม่ได้สร้าง ID เมื่อ create record ใหม่

**วิธีแก้:**
```typescript
await prisma.creator_price_history.create({
  data: {
    id: `cph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    // ... other fields
  }
})
```

## สรุป

ระบบจัดการ Creators ที่สร้างขึ้นครอบคลุม:
- ✅ หน้ารายการ Creators พร้อมการกรองและค้นหา
- ✅ หน้ารายละเอียดครบถ้วน (ข้อมูล, งาน, ราคา, รายได้)
- ✅ ระบบอนุมัติ/ปฏิเสธพร้อมกำหนดราคา
- ✅ การจัดการและติดตามประวัติราคา
- ✅ การดูงานและรายได้ของ Creator
- ✅ API endpoints ครบถ้วน
- ✅ ระบบ pagination และ filtering

ทำให้ Admin สามารถจัดการ Creator ได้อย่างมีประสิทธิภาพ!
