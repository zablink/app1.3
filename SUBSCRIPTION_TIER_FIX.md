# Subscription Tier Display Fix

## Issue
ร้านค้าในหน้า home ไม่ถูกแยกตาม subscription package (PREMIUM, PRO, BASIC, FREE) อย่างถูกต้อง

## Root Cause

### 1. SQL Query Issue
Query เดิมใช้ `DISTINCT ON (s.id)` แต่เรียงลำดับด้วย:
```sql
ORDER BY s.id, tier_rank ASC, s."createdAt" DESC
```

ปัญหา: `DISTINCT ON (s.id)` จะเลือก row แรกที่เจอสำหรับแต่ละ shop_id ตามลำดับการ ORDER BY  
เนื่องจาก `s.id` อยู่ลำดับแรก จึงเลือก row ที่เจอก่อนไม่ใช่ row ที่มี tier ดีที่สุด

### 2. Data Issue
พบว่ามีร้านค้าบางร้านมี active subscription หลายแพ็กเกจพร้อมกัน:
- เบเกอรี่อบสดประชาอุทิศ: 8 subscriptions (PRO, BASIC x4, FREE x3)
- สเต๊กพรีเมียม: 3 subscriptions (PREMIUM, PRO, BASIC)
- ครัวอาหารใต้บางปลากด: 2 subscriptions (BASIC x2)
- ร้านก๋วยเตี๋ยวเรือสมุทรปราการ: 2 subscriptions (PREMIUM, PRO)

## Solution

### ใช้ CTE (Common Table Expression) เพื่อเลือก subscription ที่ดีที่สุดก่อน

```sql
WITH ranked_shops AS (
  SELECT DISTINCT ON (s.id)
    s.id, s.name, s.description, s.address, s."createdAt", s.image, s.lat, s.lng, s.is_mockup as "isMockup",
    lt.name_th as subdistrict,
    la.name_th as district,
    lp.name_th as province,
    COALESCE(sp.tier, 'FREE') as "subscriptionTier",
    (
      SELECT JSON_AGG(JSON_BUILD_OBJECT('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'icon', sc.icon))
      FROM shop_category_mapping scm
      JOIN "ShopCategory" sc ON scm.category_id = sc.id
      WHERE scm.shop_id = s.id
    ) as categories,
    CASE sp.tier
      WHEN 'PREMIUM' THEN 1
      WHEN 'PRO' THEN 2
      WHEN 'BASIC' THEN 3
      ELSE 4
    END as tier_rank
  FROM "Shop" s
  LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
  LEFT JOIN loc_amphures la ON s.amphure_id = la.id
  LEFT JOIN loc_provinces lp ON s.province_id = lp.id
  LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
    AND ss.status = 'ACTIVE' 
    AND ss.end_date > NOW()
  LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
  WHERE s.status = 'APPROVED'
  ORDER BY s.id, tier_rank ASC, ss.end_date DESC NULLS LAST
)
SELECT id, name, description, address, "createdAt", image, lat, lng, "isMockup",
       subdistrict, district, province, "subscriptionTier", categories
FROM ranked_shops
ORDER BY tier_rank ASC, "createdAt" DESC
LIMIT 50;
```

### Key Points:

1. **CTE (ranked_shops)**: เลือก subscription ที่ดีที่สุดของแต่ละร้าน
   - `DISTINCT ON (s.id)`: เลือกเพียง 1 row ต่อ 1 ร้าน
   - `ORDER BY s.id, tier_rank ASC`: เรียงตาม shop id ก่อน แล้วเลือก tier ที่มี rank ต่ำสุด (ดีที่สุด)
   - `ss.end_date DESC NULLS LAST`: ถ้า tier เท่ากัน เลือกที่หมดอายุช้าสุด

2. **Outer SELECT**: เรียงลำดับผลลัพธ์ตาม tier
   - `ORDER BY tier_rank ASC`: PREMIUM → PRO → BASIC → FREE

## Results After Fix

```
PREMIUM: 9 shops
PRO: 5 shops
BASIC: 4 shops
FREE: 13 shops
Total: 31 shops (APPROVED status)
```

### Shops with Multiple Subscriptions (correctly resolved):
- ✅ เบเกอรี่อบสดประชาอุทิศ → PRO (best available)
- ✅ สเต๊กพรีเมียม → PREMIUM
- ✅ ครัวอาหารใต้บางปลากด → BASIC
- ✅ ร้านก๋วยเตี๋ยวเรือสมุทรปราการ → PREMIUM

## Files Modified

- `/src/app/api/shops/route.ts` - แก้ไขทุก SQL query ที่ดึงข้อมูลร้านค้า:
  - Random query (no location)
  - Area-based query
  - Distance-based progressive query
  - Final fallback query

## Testing

Run test scripts:
```bash
npx tsx scripts/check-subscriptions.ts
npx tsx scripts/test-final-query.ts
npx tsx scripts/verify-subscription-data.ts
```

## Notes

- ปัญหานี้ส่งผลกระทบเฉพาะการแสดงผลบน UI เท่านั้น ข้อมูลใน database ไม่ได้เสียหาย
- แนะนำให้เพิ่ม unique constraint หรือ business logic เพื่อป้องกันไม่ให้ร้านมี active subscription หลายตัวพร้อมกัน
- Frontend (page.tsx) ใช้ `groupShopsByTier()` เพื่อแยกร้านตาม tier อย่างถูกต้อง

## Date Fixed
25 November 2025
