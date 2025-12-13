# Database Setup Guide

## ปัญหาที่พบ (Current Issue)

หน้าแรกของ branch dev มีปัญหาโหลดร้านไม่ได้ เนื่องจาก:
1. ยังไม่มีการตั้งค่า `DATABASE_URL` 
2. API จะใช้ mock data แทนเมื่อไม่มี database connection

## การแก้ไข (Solution)

API `/api/shops` ได้รับการปรับปรุงให้:
- **รองรับทั้ง mock data และ real database**
- ตรวจสอบว่ามี `DATABASE_URL` หรือไม่
- ถ้ามี database → ดึงข้อมูลจาก Prisma
- ถ้าไม่มี หรือ database error → ใช้ mock data
- มี error handling ที่ดีขึ้น

## ขั้นตอนการตั้งค่า Database

### 1. สร้าง PostgreSQL Database

```bash
# ตัวอย่างการสร้าง database ด้วย psql
createdb zablink_dev
```

หรือใช้ cloud database service เช่น:
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless Postgres
- [Railway](https://railway.app) - Easy deployment
- [Vercel Postgres](https://vercel.com/storage/postgres)

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` (หรือ `.env.local`):

```bash
# คัดลอกจาก .env.example
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/zablink_dev"

# ตัวอย่าง Supabase
# DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# NextAuth Secret
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma Client และ Migrate Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (สร้าง tables ใน database)
npx prisma migrate dev --name init

# หรือ push schema โดยตรง (สำหรับ development)
npx prisma db push
```

### 4. Seed Database (Optional)

หากมีข้อมูลทดสอบ:

```bash
npx prisma db seed
```

### 5. ตรวจสอบการเชื่อมต่อ

```bash
# เปิด Prisma Studio เพื่อดูข้อมูลใน database
npx prisma studio
```

## การใช้งาน

### Mode 1: Mock Data (ไม่มี DATABASE_URL)
- API จะใช้ mock data (2 ร้านทดสอบใน Bangkok)
- เหมาะสำหรับ development เบื้องต้น
- ไม่ต้องตั้งค่า database

### Mode 2: Real Database (มี DATABASE_URL)
- API จะดึงข้อมูลจาก Prisma/PostgreSQL
- รองรับข้อมูลร้านจริง
- มี fallback เป็น mock data ถ้า query ล้มเหลว

## Schema Overview

ตาราง `Shop` ใน database:

```prisma
model Shop {
  id            String       @id @default(cuid())
  name          String       // ชื่อร้าน
  description   String?      // คำอธิบาย
  address       String?      // ที่อยู่
  lat           Float?       // Latitude
  lng           Float?       // Longitude
  image         String?      // รูปภาพ
  category      ShopCategory // หมวดหมู่
  owner         User         // เจ้าของร้าน
  adPackage     AdPackage?   // Package โฆษณา (Free, Pro1, Pro2, Pro3, Special)
  // ... fields อื่นๆ
}
```

## การเพิ่มข้อมูลร้าน

### ผ่าน Prisma Studio
```bash
npx prisma studio
# เปิด http://localhost:5555
# เพิ่มข้อมูลผ่าน UI
```

### ผ่าน Code (Seed)
แก้ไขไฟล์ `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // สร้าง Category
  const category = await prisma.shopCategory.upsert({
    where: { name: 'อาหารตามสั่ง' },
    update: {},
    create: { name: 'อาหารตามสั่ง' },
  });

  // สร้าง User (Owner)
  const user = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Test Owner',
      role: 'SHOP',
    },
  });

  // สร้าง Shop
  await prisma.shop.create({
    data: {
      name: 'ร้านข้าวผัดอร่อย',
      description: 'ข้าวผัดรสเด็ด',
      lat: 13.7563,
      lng: 100.5018,
      categoryId: category.id,
      ownerId: user.id,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

จากนั้นรัน:
```bash
npx prisma db seed
```

## Troubleshooting

### ปัญหา: "ไม่สามารถเชื่อมต่อ database"
- ตรวจสอบ `DATABASE_URL` ใน `.env`
- ตรวจสอบว่า database server กำลังทำงาน
- ตรวจสอบ firewall/network settings

### ปัญหา: "Prisma Client ไม่พบ"
```bash
npx prisma generate
```

### ปัญหา: "Table ไม่มีใน database"
```bash
npx prisma migrate dev
# หรือ
npx prisma db push
```

### ปัญหา: หน้าแรกโหลดช้า
- ตรวจสอบ network latency ไปยัง database
- พิจารณาใช้ connection pooling
- เพิ่ม index ใน database:
  ```sql
  CREATE INDEX idx_shop_location ON "Shop" (lat, lng);
  ```

## ข้อมูลเพิ่มเติม

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
