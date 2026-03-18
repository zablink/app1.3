# 🔧 Vercel Database Setup Guide

## ⚠️ ปัญหา: PrismaClientInitializationError

Error: `Can't reach database server at 'db.gysckclnnitkgafvdkno.supabase.co:5432'`

## 📋 วิธีแก้ไข

### 1. ตั้งค่า DATABASE_URL ใน Vercel

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่ม/แก้ไข `DATABASE_URL`:

#### Option A: ใช้ Connection Pooler (แนะนำสำหรับ Production)

```
postgresql://postgres:[YOUR-PASSWORD]@db.gysckclnnitkgafvdkno.supabase.co:6543/postgres?pgbouncer=true
```

**หรือใช้ pooler subdomain:**

```
postgresql://postgres:[YOUR-PASSWORD]@pooler.gysckclnnitkgafvdkno.supabase.co:5432/postgres?pgbouncer=true
```

#### Option B: ใช้ Direct Connection (ถ้า pooler ไม่ทำงาน)

```
postgresql://postgres:[YOUR-PASSWORD]@db.gysckclnnitkgafvdkno.supabase.co:5432/postgres
```

### 2. ตรวจสอบ Connection String

อย่าใส่รหัสผ่านจริงลงในเอกสาร/โค้ด ให้ใช้ placeholder:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.gysckclnnitkgafvdkno.supabase.co:5432/postgres"
```

**สำหรับ Vercel Production ควรใช้:**

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.gysckclnnitkgafvdkno.supabase.co:6543/postgres?pgbouncer=true"
```

### 3. ตรวจสอบ Supabase Connection Pooling

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Settings** → **Database**
4. ดู **Connection Pooling** section
5. Copy **Connection string** ที่มี `pooler` หรือ port `6543`

### 4. Redeploy บน Vercel

หลังจากตั้งค่า Environment Variables แล้ว:

1. ไปที่ Vercel Dashboard
2. เลือก Project
3. ไปที่ **Deployments**
4. คลิก **Redeploy** บน deployment ล่าสุด

หรือ push code ใหม่:

```bash
git commit --allow-empty -m "Trigger redeploy for database connection"
git push
```

## 🔍 ตรวจสอบว่า DATABASE_URL ถูกตั้งค่าหรือไม่

สร้าง API endpoint เพื่อตรวจสอบ:

```
GET /api/test-env
```

หรือดูใน Vercel Logs:
1. ไปที่ Vercel Dashboard → Project → Logs
2. ดู logs ที่ขึ้นต้นด้วย `[prisma]` หรือ `[api/shops]`

## ⚠️ หมายเหตุ

- **Connection Pooler (port 6543)**: ใช้สำหรับ serverless environments เช่น Vercel
- **Direct Connection (port 5432)**: ใช้สำหรับ local development หรือ long-running processes
- **pgbouncer=true**: จำเป็นสำหรับ connection pooler

## 📚 อ้างอิง

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
