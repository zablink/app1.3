# 🔧 แก้ไข Database Connection Error

## ⚠️ ปัญหา

```
PrismaClientInitializationError: Can't reach database server at 
db.gysckclnnitkgafvdkno.supabase.co:5432
```

**สาเหตุ:** ใช้ Direct Connection (port 5432) ซึ่งไม่ทำงานใน Vercel Serverless

---

## ✅ วิธีแก้ไข

### ขั้นตอนที่ 1: ตั้งค่า DATABASE_URL ใน Vercel

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project: **zablink** หรือ **app1.3**
3. ไปที่ **Settings** → **Environment Variables**
4. ค้นหา `DATABASE_URL` หรือคลิก **Add New**

### ขั้นตอนที่ 2: ตั้งค่า Connection String

**จาก `.env` file ของคุณ:**
```
postgresql://postgres:YpYuAJY1wS7fFQo0@db.gysckclnnitkgafvdkno.supabase.co:5432/postgres
```

**เปลี่ยนเป็น (ใช้ Connection Pooler - port 6543):**

```
postgresql://postgres:YpYuAJY1wS7fFQo0@db.gysckclnnitkgafvdkno.supabase.co:6543/postgres?pgbouncer=true
```

### ขั้นตอนที่ 3: ตั้งค่า Environment

- **Key:** `DATABASE_URL`
- **Value:** `postgresql://postgres:YpYuAJY1wS7fFQo0@db.gysckclnnitkgafvdkno.supabase.co:6543/postgres?pgbouncer=true`
- **Environment:** เลือก **Production**, **Preview**, และ **Development** (หรือเลือกทั้งหมด)

### ขั้นตอนที่ 4: Redeploy

1. หลังจาก Save Environment Variables แล้ว
2. ไปที่ **Deployments** tab
3. คลิก **⋯** (three dots) บน deployment ล่าสุด
4. เลือก **Redeploy**

หรือ push code ใหม่:
```bash
git commit --allow-empty -m "Trigger redeploy after DATABASE_URL fix"
git push
```

---

## 🔍 ตรวจสอบว่าแก้ไขแล้วหรือยัง

### 1. ตรวจสอบ Environment Variables

เปิดใน browser:
```
https://dev.zablink.com/api/test-env
```

ดูว่า `DATABASE_URL` แสดงเป็น `✅ Set` หรือไม่

### 2. ตรวจสอบ Database Connection

เปิดใน browser:
```
https://dev.zablink.com/api/shops/test-connection
```

ควรจะเห็น:
```json
{
  "success": true,
  "connection": {
    "connected": true,
    "tableExists": true,
    "shopCount": [จำนวนร้าน],
    ...
  }
}
```

### 3. ตรวจสอบ Shops API

เปิดใน browser:
```
https://dev.zablink.com/api/shops?limit=5
```

ควรจะเห็น:
```json
{
  "success": true,
  "shops": [...],
  "hasLocation": false,
  "queryTime": ...
}
```

---

## 📝 หมายเหตุ

### Direct Connection vs Connection Pooler

| Type | Port | ใช้เมื่อ | ข้อจำกัด |
|------|------|---------|---------|
| **Direct** | 5432 | Local Development | ❌ ไม่ทำงานใน Vercel Serverless |
| **Pooler** | 6543 | Production (Vercel) | ✅ ทำงานใน Serverless |

### Connection String Format

**Direct Connection (Local):**
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
```

**Connection Pooler (Production):**
```
postgresql://postgres:PASSWORD@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

---

## 🆘 ถ้ายังไม่ได้

### ตรวจสอบ Supabase Connection Pooling

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Settings** → **Database**
4. ดู **Connection Pooling** section
5. Copy **Connection string** ที่มี `pooler` หรือ port `6543`

### ตรวจสอบ Vercel Logs

1. ไปที่ Vercel Dashboard → Project → **Logs**
2. ดู logs ที่ขึ้นต้นด้วย `[prisma]` หรือ `[api/shops]`
3. ตรวจสอบว่า DATABASE_URL ถูกใช้หรือไม่

### ตรวจสอบ Network Access

- ตรวจสอบว่า Supabase database อนุญาต connection จาก Vercel IPs หรือไม่
- ตรวจสอบว่า firewall หรือ security groups ไม่ได้ block connection

---

## 📚 อ้างอิง

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
