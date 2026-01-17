# 🔍 Database Connection Debug Guide

## 📋 Debug Endpoints

### 1. `/api/debug/connection` - Comprehensive Connection Test

ตรวจสอบ database connection แบบครบถ้วน:

```
GET https://dev.zablink.com/api/debug/connection
```

**Response จะแสดง:**
- Environment info (NODE_ENV, VERCEL, etc.)
- DATABASE_URL configuration (safe - ไม่มี password)
- Connection type (pooler/direct)
- Prisma client status
- Test results:
  - Basic query test
  - Table existence check
  - Shop count
  - Settings count

**Example Response:**
```json
{
  "timestamp": "2025-01-17T...",
  "environment": {
    "NODE_ENV": "production",
    "VERCEL": true
  },
  "database": {
    "urlConfigured": true,
    "urlSafe": "postgresql://postgres:****@db.xxx.supabase.co:6543/postgres",
    "urlType": "connection-pooler",
    "connectionStatus": "connected"
  },
  "tests": {
    "basicQuery": { "success": true },
    "shopCount": { "success": true, "count": 10 }
  }
}
```

---

### 2. `/api/debug/prisma` - Prisma Client Debug

ตรวจสอบ Prisma client และ database details:

```
GET https://dev.zablink.com/api/debug/prisma
```

**Response จะแสดง:**
- Prisma client type
- Database version
- PostGIS extension status
- List of all tables
- Shop table structure

---

### 3. `/api/debug/env` - Environment Variables Check

ตรวจสอบ environment variables (safe - ไม่มี sensitive data):

```
GET https://dev.zablink.com/api/debug/env
```

**Response จะแสดง:**
- Environment info
- DATABASE_URL status (safe)
- Auth variables status
- Supabase variables status
- Omise variables status
- Recommendations

---

## 🔧 วิธีใช้งาน

### 1. ตรวจสอบ Connection

เปิดใน browser:
```
https://dev.zablink.com/api/debug/connection
```

**ถ้า connection สำเร็จ:**
- `connectionStatus: "connected"`
- `tests.basicQuery.success: true`
- `tests.shopCount.count: [จำนวน]`

**ถ้า connection ล้มเหลว:**
- `connectionStatus: "failed"`
- `database.error: [error message]`
- ดู `recommendations` สำหรับวิธีแก้ไข

### 2. ตรวจสอบ Environment Variables

เปิดใน browser:
```
https://dev.zablink.com/api/debug/env
```

**ตรวจสอบ:**
- `DATABASE_URL_SET: true`
- `DATABASE_URL_TYPE: "connection-pooler"` (สำหรับ Vercel)
- `DATABASE_URL_PORT: "6543"` (ไม่ใช่ "5432")

### 3. ตรวจสอบ Prisma Client

เปิดใน browser:
```
https://dev.zablink.com/api/debug/prisma
```

**ตรวจสอบ:**
- `connection.status: "connected"`
- `connection.tests` - ทุก test ควร `success: true`

---

## 🐛 Troubleshooting

### Problem: `connectionStatus: "failed"` with Connection Pooler

**อาการ:** ใช้ connection pooler (port 6543) แล้ว แต่ยัง connection ล้มเหลว

**Error message:**
```
Can't reach database server at db.xxx.supabase.co:6543
```

**สาเหตุที่เป็นไปได้:**

1. **Local Development ใช้ Pooler (ไม่ควร)**
   - Connection pooler (port 6543) ถูกออกแบบมาสำหรับ serverless (Vercel)
   - Local development ควรใช้ direct connection (port 5432)

2. **Supabase Project ถูก Pause**
   - Supabase free tier อาจจะ pause project ถ้าไม่ใช้งาน
   - ตรวจสอบ Supabase Dashboard → Project status

3. **Network/Firewall Block**
   - Firewall หรือ network settings block port 6543
   - VPN อาจจะ block connection

4. **DATABASE_URL ไม่ถูกต้อง**
   - Password ผิด
   - Hostname หรือ port ผิด

**วิธีแก้ไข:**

#### สำหรับ Local Development:
```bash
# เปลี่ยน DATABASE_URL ใน .env จาก:
postgresql://postgres:****@db.xxx.supabase.co:6543/postgres?pgbouncer=true

# เป็น (ใช้ direct connection):
postgresql://postgres:****@db.xxx.supabase.co:5432/postgres
```

#### สำหรับ Vercel Production:
1. ตรวจสอบ Supabase Dashboard:
   - ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
   - เลือก Project
   - ตรวจสอบว่า Project status เป็น **Active** (ไม่ใช่ Paused)

2. ตรวจสอบ Connection String:
   - ไปที่ **Settings** → **Database**
   - Copy **Connection string** จาก **Connection Pooling** section
   - ใช้ connection string ที่มี `pooler` หรือ port `6543`

3. ตรวจสอบ Vercel Environment Variables:
   - ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
   - ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าแล้ว
   - ตรวจสอบว่าใช้ port 6543 และมี `?pgbouncer=true`

4. ลองใช้ Pooler Subdomain:
   ```
   postgresql://postgres:****@pooler.xxx.supabase.co:5432/postgres?pgbouncer=true
   ```

### Problem: `connectionStatus: "failed"`

**สาเหตุที่เป็นไปได้:**
1. DATABASE_URL ไม่ถูกตั้งค่าใน Vercel
2. ใช้ direct connection (port 5432) ใน Vercel
3. Database server ไม่สามารถเข้าถึงได้
4. Firewall หรือ security groups block connection

**วิธีแก้ไข:**
1. ตรวจสอบ `/api/debug/env` ดูว่า `DATABASE_URL_SET: true` หรือไม่
2. ถ้า `DATABASE_URL_TYPE: "direct-connection"` → เปลี่ยนเป็น `connection-pooler` (port 6543)
3. ตรวจสอบ Supabase Dashboard ว่า database ทำงานอยู่หรือไม่

### Problem: `tests.basicQuery.success: false`

**Error message จะบอกว่า:**
- `Can't reach database server` → Connection issue
- `Authentication failed` → Wrong password
- `Database does not exist` → Wrong database name

**วิธีแก้ไข:**
1. ตรวจสอบ DATABASE_URL ใน Vercel
2. ตรวจสอบ password และ connection string
3. ตรวจสอบว่า database server ทำงานอยู่

### Problem: `tests.shopCount.count: 0`

**สาเหตุที่เป็นไปได้:**
1. ยังไม่มีร้านใน database
2. WHERE clause filter ร้านออกหมด
3. Table structure ไม่ถูกต้อง

**วิธีแก้ไข:**
1. ตรวจสอบ `/api/debug/prisma` ดู table structure
2. ตรวจสอบ database โดยตรงว่ามีร้านหรือไม่
3. ตรวจสอบ WHERE clause ใน `/api/shops/route.ts`

---

## 📝 Checklist

ก่อน deploy ตรวจสอบ:

- [ ] `/api/debug/env` → `DATABASE_URL_SET: true`
- [ ] `/api/debug/env` → `DATABASE_URL_TYPE: "connection-pooler"` (ถ้าใช้ Vercel)
- [ ] `/api/debug/connection` → `connectionStatus: "connected"`
- [ ] `/api/debug/connection` → `tests.basicQuery.success: true`
- [ ] `/api/debug/connection` → `tests.shopCount.count > 0` (ถ้ามีร้าน)
- [ ] `/api/debug/prisma` → `connection.status: "connected"`

---

## 🔗 Related Files

- `FIX_DATABASE_CONNECTION.md` - คู่มือแก้ไข connection error
- `VERCEL_DATABASE_SETUP.md` - คู่มือตั้งค่า DATABASE_URL ใน Vercel
- `src/app/api/shops/test-connection/route.ts` - Simple connection test
- `src/app/api/shops/debug/route.ts` - Shops debug endpoint
