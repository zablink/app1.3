# 📝 หมายเหตุเรื่อง Migration

## ⚠️ สำหรับโปรเจคเริ่มต้นจาก 0

เนื่องจากโปรเจคนี้เริ่มต้นจาก 0 ยังไม่มี data ต้นทาง **ไม่จำเป็นต้องใช้ Migration files**

## ✅ วิธีที่แนะนำ

### ใช้ `prisma db push` (สำหรับ Development)

```bash
# สร้าง/อัปเดต database ตาม schema.prisma
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**ข้อดี:**
- ง่าย รวดเร็ว
- ไม่ต้องจัดการ migration files
- เหมาะกับโปรเจคใหม่

**ข้อเสีย:**
- ไม่มี history ของการเปลี่ยนแปลง schema
- ไม่เหมาะกับ production (ควรใช้ migration)

---

## 🔄 ถ้าต้องการใช้ Migration (สำหรับ Production)

### สร้าง Initial Migration

```bash
# สร้าง migration ที่สร้าง tables ทั้งหมด
npx prisma migrate dev --name init

# หรือถ้ามี database อยู่แล้ว
npx prisma migrate dev --create-only --name add_og_campaign_fields
```

**Migration file ที่สร้างไว้** (`20250101_add_og_campaign_fields`) สามารถลบได้ถ้าใช้ `db push`

---

## 📋 Fields ที่ต้องมีใน Database

### User Table
- `is_og_member` (BOOLEAN)
- `og_joined_at` (TIMESTAMP)
- `og_benefits_until` (TIMESTAMP)
- `og_badge_enabled` (BOOLEAN)

### ShopSubscription Table
- `is_og_subscription` (BOOLEAN)
- `og_token_multiplier` (FLOAT)
- `og_usage_discount` (FLOAT)

### Indexes
- `idx_shop_subscriptions_og` on `shop_subscriptions(is_og_subscription)`

---

## 🚀 ขั้นตอน Setup

1. **Setup Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Setup OG Campaign Settings:**
   ```bash
   npx tsx scripts/setup-og-campaign.ts
   ```

3. **Ready to use!**

---

**Last Updated:** 2025-01-XX
