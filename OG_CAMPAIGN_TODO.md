# 🎖️ OG Campaign - สรุปส่วนที่ยังไม่ครบ

## ✅ ส่วนที่ทำเสร็จแล้ว

1. ✅ **Helper Functions** (`src/lib/og-campaign.ts`)
   - ฟังก์ชันตรวจสอบ OG eligibility
   - คำนวณ Token 2 เท่า
   - คำนวณส่วนลด 30%
   - ตรวจสอบสถานะ OG

2. ✅ **Subscription Route** (`src/app/api/shops/[shopId]/subscription/route.ts`)
   - ตรวจสอบ OG เมื่อสมัครสมาชิก
   - ให้ Token 2 เท่า
   - อัปเดต User.isOGMember

3. ✅ **Ads Purchase Route** (`src/app/api/ads/purchase/route.ts`)
   - ใช้ส่วนลด 30% สำหรับ OG

4. ✅ **Campaign Jobs Complete Route** (`src/app/api/campaign-jobs/[id]/complete/route.ts`)
   - ใช้ส่วนลด 30% สำหรับ OG

5. ✅ **Database Schema** (`prisma/schema.prisma`)
   - เพิ่ม OG fields ใน User model
   - เพิ่ม OG fields ใน ShopSubscription model

6. ✅ **Setup Script** (`scripts/setup-og-campaign.ts`)
   - Script สำหรับตั้งค่า SiteSetting

---

## ❌ ส่วนที่ยังไม่ครบ

### 1. Database Migration
**สถานะ:** ยังไม่ได้สร้าง migration

**สิ่งที่ต้องทำ:**
- สร้าง migration file สำหรับ OG fields
- รัน migration

**ไฟล์:** `prisma/migrations/YYYYMMDD_add_og_campaign_fields/migration.sql`

---

### 2. Frontend - OG Badge Display
**สถานะ:** ยังไม่มี UI แสดง OG badge

**ไฟล์ที่ต้องอัปเดต:**
- `src/app/shop/[shopId]/page.tsx` - Shop Detail Page
- `src/components/home/ShopCard.tsx` - Shop Card Component
- `src/app/page.tsx` - Homepage (ถ้าจำเป็น)

**สิ่งที่ต้องทำ:**
- แสดง OG badge ถ้า `user.ogBadgeEnabled = true`
- แสดง badge ใกล้กับ subscription tier badge

---

### 3. API - Shop Detail
**สถานะ:** ยังไม่ได้ดึง OG status

**ไฟล์:** `src/app/api/shops/[shopId]/route.ts`

**สิ่งที่ต้องทำ:**
- ดึง User.isOGMember และ ogBadgeEnabled
- ส่ง OG status ไปยัง frontend

---

### 4. Admin - Assign Package Route
**สถานะ:** ยังไม่ได้ใช้ OG logic

**ไฟล์:** `src/app/api/admin/shops/[shopId]/assign-package/route.ts`

**สิ่งที่ต้องทำ:**
- ตรวจสอบ OG eligibility เมื่อ admin assign package
- ให้ Token 2 เท่าถ้าเป็น OG
- อัปเดต OG fields

---

### 5. Admin - Bulk Assign Package
**สถานะ:** ยังไม่ได้ใช้ OG logic

**ไฟล์:** `src/app/api/admin/shops/bulk-assign-package/route.ts`

**สิ่งที่ต้องทำ:**
- ตรวจสอบ OG eligibility สำหรับแต่ละ shop
- ให้ Token 2 เท่าถ้าเป็น OG

---

### 6. Admin Settings - OG Campaign Settings
**สถานะ:** ยังไม่มี UI สำหรับตั้งค่า

**ไฟล์:** `src/app/admin/settings/page.tsx`

**สิ่งที่ต้องทำ:**
- เพิ่ม category "campaign" ใน settings page
- แสดง OG campaign settings:
  - `og_campaign_enabled`
  - `og_campaign_start_date`
  - `og_campaign_end_date`
  - `og_benefits_duration_days`
  - `og_token_multiplier`
  - `og_usage_discount`

---

### 7. Shop Dashboard - OG Status
**สถานะ:** ยังไม่แสดง OG status

**ไฟล์:** `src/app/dashboard/shop/page.tsx`

**สิ่งที่ต้องทำ:**
- แสดง OG status ถ้าเป็น OG member
- แสดง benefits until date
- แสดง token multiplier และ usage discount

---

### 8. Pricing Page - OG Campaign Info
**สถานะ:** ยังไม่มีข้อมูล OG campaign

**ไฟล์:** `src/app/pricing/page.tsx`

**สิ่งที่ต้องทำ:**
- แสดงข้อมูล OG campaign (ถ้ายังเปิดอยู่)
- แสดง benefits ที่จะได้รับ
- แสดงวันที่สิ้นสุด campaign

---

### 9. Token Purchase Route
**สถานะ:** ตรวจสอบแล้ว - ไม่ต้องใช้ OG logic
**เหตุผล:** Token purchase ไม่ได้เกี่ยวข้องกับ OG campaign (OG ได้ Token จาก subscription เท่านั้น)

---

## 📋 Priority Order

### High Priority (ต้องทำก่อน)
1. **Database Migration** - ต้องทำก่อนเพื่อให้ fields ใช้งานได้
2. **API Shop Detail** - เพื่อให้ frontend แสดง OG badge ได้
3. **Frontend OG Badge** - เพื่อให้ผู้ใช้เห็น OG status

### Medium Priority
4. **Admin Assign Package** - เพื่อให้ admin สามารถ assign OG package ได้
5. **Admin Settings** - เพื่อให้ admin ตั้งค่า campaign ได้

### Low Priority
6. **Shop Dashboard** - Nice to have
7. **Pricing Page** - Nice to have
8. **Bulk Assign** - Nice to have

---

## 🔧 Implementation Notes

### Migration Fields
```sql
-- User table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_og_member BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS og_joined_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS og_benefits_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS og_badge_enabled BOOLEAN DEFAULT true;

-- ShopSubscription table
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS is_og_subscription BOOLEAN DEFAULT false;
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS og_token_multiplier FLOAT DEFAULT 1.0;
ALTER TABLE shop_subscriptions ADD COLUMN IF NOT EXISTS og_usage_discount FLOAT DEFAULT 0.0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_subscriptions_og ON shop_subscriptions(is_og_subscription);
```

### OG Badge Component
```tsx
{user?.isOGMember && user?.ogBadgeEnabled && (
  <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold rounded-full">
    🎖️ OG
  </span>
)}
```

---

**Last Updated:** 2025-01-XX
