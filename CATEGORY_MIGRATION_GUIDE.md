# Category System Migration Guide

## สรุปการเปลี่ยนแปลง

เปลี่ยนจากระบบหมวดหมู่แบบ **One-to-Many** เป็น **Many-to-Many** เพื่อให้ร้านค้าสามารถอยู่ในหลายหมวดหมู่พร้อมกันได้

---

## 🔄 Database Changes

### Before (One-to-Many)
```prisma
model Shop {
  categoryId String
  category   ShopCategory @relation(fields: [categoryId], references: [id])
}

model ShopCategory {
  id    String @id
  name  String @unique
  shops Shop[]
}
```

### After (Many-to-Many)
```prisma
model Shop {
  categories ShopCategoryMapping[]
}

model ShopCategory {
  id          String   @id
  name        String   @unique
  slug        String   @unique  // ใหม่: สำหรับ URL
  icon        String?            // ใหม่: emoji หรือ icon
  description String?            // ใหม่: คำอธิบาย
  shops       ShopCategoryMapping[]
}

model ShopCategoryMapping {
  id         String
  shopId     String
  categoryId String
  shop       Shop         @relation(...)
  category   ShopCategory @relation(...)
  @@unique([shopId, categoryId])
}
```

---

## 📝 Migration Steps

### 1. Run Database Migration
```bash
# รัน migration ใน Supabase SQL Editor
psql $DATABASE_URL -f prisma/migrations/20241122_category_many_to_many/migration.sql
```

Migration จะ:
- ✅ สร้างตาราง `shop_category_mapping`
- ✅ เพิ่มฟิลด์ `slug`, `icon`, `description` ใน `ShopCategory`
- ✅ Migrate ข้อมูลเดิมจาก `Shop.categoryId` → `shop_category_mapping`
- ✅ สร้าง slug อัตโนมัติจากชื่อหมวดหมู่
- ✅ ลบ column `categoryId` จาก `Shop` (comment ไว้ถ้าต้องการ rollback)

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Seed Categories
```bash
npx ts-node scripts/seed-categories.ts
```

จะเพิ่มหมวดหมู่ 25 หมวด พร้อม icon และคำอธิบาย:
- 🍽️ อาหารและเครื่องดื่ม
- 🇹🇭 อาหารไทย
- 🥢 อาหารจีน
- 🍱 อาหารญี่ปุ่น
- 🇰🇷 อาหารเกาหลี
- ... และอื่นๆ อีก 20+ หมวด

---

## 🎯 New Features

### 1. หน้าหมวดหมู่ทั้งหมด
```
/category
```
แสดงหมวดหมู่ทั้งหมดพร้อม icon, คำอธิบาย และจำนวนร้าน

### 2. หน้ารายละเอียดหมวดหมู่
```
/category/[slug]
เช่น: /category/thai-food
      /category/cafe
      /category/seafood
```
แสดงร้านค้าทั้งหมดในหมวดนั้นๆ พร้อม subscription badge

### 3. API Endpoints

#### GET /api/categories
```json
{
  "success": true,
  "categories": [
    {
      "id": "...",
      "name": "อาหารไทย",
      "slug": "thai-food",
      "icon": "🇹🇭",
      "description": "ร้านอาหารไทยต้นตำรับ...",
      "_count": {
        "shops": 15
      }
    }
  ]
}
```

#### GET /api/categories/[slug]
```json
{
  "success": true,
  "category": {
    "id": "...",
    "name": "อาหารไทย",
    "slug": "thai-food",
    "icon": "🇹🇭",
    "description": "..."
  },
  "shops": [
    {
      "id": "...",
      "name": "ครัวป้าหนิง",
      "description": "...",
      "image": "...",
      "subscriptionTier": "PREMIUM"
    }
  ]
}
```

---

## 🔧 Usage Examples

### เพิ่มหมวดหมู่ให้ร้าน (Admin)
```typescript
// เพิ่มร้านค้าใน 2 หมวดหมู่พร้อมกัน
await prisma.shopCategoryMapping.createMany({
  data: [
    { shopId: "shop-uuid", categoryId: "thai-food-id" },
    { shopId: "shop-uuid", categoryId: "seafood-id" },
  ],
});
```

### Query ร้านพร้อมหมวดหมู่
```typescript
const shop = await prisma.shop.findUnique({
  where: { id: shopId },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
});

// shop.categories = [
//   { category: { name: "อาหารไทย", slug: "thai-food", icon: "🇹🇭" } },
//   { category: { name: "อาหารทะเล", slug: "seafood", icon: "🦞" } },
// ]
```

### Query หมวดหมู่พร้อมจำนวนร้าน
```typescript
const categories = await prisma.shopCategory.findMany({
  include: {
    _count: {
      select: { shops: true },
    },
  },
});
```

---

## 📋 Updated Files

### New Files
- ✅ `prisma/migrations/20241122_category_many_to_many/migration.sql`
- ✅ `scripts/seed-categories.ts`
- ✅ `src/app/category/page.tsx`
- ✅ `src/app/category/[slug]/page.tsx` (updated)
- ✅ `src/app/api/categories/route.ts`
- ✅ `src/app/api/categories/[slug]/route.ts`

### Modified Files
- ✅ `prisma/schema.prisma`
- ✅ `src/app/api/shops/route.ts` (added location fields)
- ✅ `src/app/shop/page.tsx` (needs update for category filter)

---

## 🚀 Next Steps

### หน้า Shop List (/shop)
ตอนนี้ category filter ยังใช้งานไม่ได้เต็มที่ เพราะ `shop.category` เป็น string แบบเก่า ต้องแก้:

1. **Option A:** อัพเดท API `/api/shops` ให้ return `categories[]` แทน `category`
2. **Option B:** ใช้ query parameter `?category=slug` แล้วกรองที่ backend

แนะนำ **Option A** เพราะจะได้แสดงหลาย badge ในการ์ดร้านค้า

### Admin Panel
ต้องเพิ่มหน้า:
- เพิ่ม/แก้ไข/ลบหมวดหมู่
- เลือกหลายหมวดหมู่ตอนสร้าง/แก้ไขร้าน (Multiselect)

---

## 🎨 UI Components

### Category Badge
```tsx
{shop.categories?.map(cat => (
  <span key={cat.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
    <span>{cat.category.icon}</span>
    <span>{cat.category.name}</span>
  </span>
))}
```

### Category Filter Dropdown
```tsx
<select value={selectedCategory} onChange={...}>
  <option value="all">ทั้งหมด</option>
  {availableCategories.map(cat => (
    <option key={cat.id} value={cat.slug}>
      {cat.icon} {cat.name}
    </option>
  ))}
</select>
```

---

## ⚠️ Breaking Changes

1. **Shop Type:** `category: string` → `categories: Array<{category: ShopCategory}>`
2. **API Response:** ต้องอัพเดท `/api/shops` ให้ส่ง categories array
3. **Filter Logic:** ต้องเปลี่ยนจาก `shop.category === selected` → check array

---

## 📊 Benefits

✅ ร้านเลือกได้หลายหมวดหมู่ (เช่น "อาหารไทย" + "อาหารทะเล")  
✅ หมวดหมู่มี slug สำหรับ SEO-friendly URLs  
✅ หมวดหมู่มี icon และคำอธิบาย  
✅ Filter แม่นยำขึ้น  
✅ UX ดีขึ้น (แสดงหลาย badge)  
✅ Scalable สำหรับอนาคต  

---

## 🔄 Rollback Plan

ถ้าต้องการย้อนกลับ:

1. Uncomment ส่วน DROP COLUMN ใน migration
2. เพิ่ม `categoryId` กลับมาที่ Shop model
3. Run: 
```sql
ALTER TABLE "Shop" ADD COLUMN "categoryId" TEXT;
UPDATE "Shop" s SET "categoryId" = (
  SELECT "category_id" FROM shop_category_mapping 
  WHERE shop_id = s.id LIMIT 1
);
```

---

Made with ❤️ for Zablink
