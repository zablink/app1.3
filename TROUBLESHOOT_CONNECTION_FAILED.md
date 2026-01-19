# 🔧 แก้ไข Connection Failed Error

## ⚠️ ปัญหา

จาก debug result:
```json
{
  "connectionStatus": "failed",
  "urlType": "connection-pooler",
  "error": "Can't reach database server at db.xxx.supabase.co:6543"
}
```

**ใช้ connection pooler (port 6543) แล้ว แต่ยัง connection ล้มเหลว**

---

## 🔍 วิเคราะห์ปัญหา

### 1. ตรวจสอบ Environment

จาก debug result:
- `VERCEL: false` → **รันบน Local Development**
- `urlType: "connection-pooler"` → ใช้ pooler (port 6543)

**⚠️ ปัญหา:** Local development ไม่ควรใช้ connection pooler!

Connection pooler (port 6543) ถูกออกแบบมาสำหรับ **serverless environments** (เช่น Vercel) ที่ต้องการ connection pooling

สำหรับ **local development** ควรใช้ **direct connection** (port 5432)

---

## ✅ วิธีแก้ไข

### สำหรับ Local Development

#### ขั้นตอนที่ 1: ตรวจสอบ `.env` file

เปิดไฟล์ `.env` ใน project root:

```bash
# ตรวจสอบ DATABASE_URL
cat .env | grep DATABASE_URL
```

#### ขั้นตอนที่ 2: เปลี่ยนเป็น Direct Connection

**จาก (Pooler - ไม่ควรใช้ใน local):**
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.gysckclnnitkgafvdkno.supabase.co:6543/postgres?pgbouncer=true"
```

**เป็น (Direct - สำหรับ local development):**
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.gysckclnnitkgafvdkno.supabase.co:5432/postgres"
```

**สิ่งที่เปลี่ยน:**
- Port: `6543` → `5432`
- ลบ `?pgbouncer=true`

#### ขั้นตอนที่ 3: Restart Development Server

```bash
# หยุด server (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

#### ขั้นตอนที่ 4: ทดสอบ Connection

เปิด browser:
```
http://localhost:3000/api/debug/connection
```

ควรเห็น:
```json
{
  "connectionStatus": "connected",
  "urlType": "direct-connection",
  "tests": {
    "basicQuery": { "success": true }
  }
}
```

---

### สำหรับ Vercel Production

ถ้า deploy บน Vercel แล้วยัง connection ล้มเหลว:

#### ขั้นตอนที่ 1: ตรวจสอบ Supabase Project Status

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ตรวจสอบว่า Project status เป็น **Active** (ไม่ใช่ Paused)

**ถ้า Project ถูก Pause:**
- คลิก **Restore** เพื่อ activate project
- รอสักครู่ให้ project เริ่มทำงาน

#### ขั้นตอนที่ 2: ตรวจสอบ Connection String

1. ไปที่ **Settings** → **Database**
2. ดู **Connection Pooling** section
3. Copy **Connection string** ที่มี `pooler` หรือ port `6543`

**ตัวอย่าง:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

#### ขั้นตอนที่ 3: ตั้งค่าใน Vercel

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project
3. ไปที่ **Settings** → **Environment Variables**
4. ค้นหา `DATABASE_URL` หรือคลิก **Add New**
5. ตั้งค่า:
   - **Key:** `DATABASE_URL`
   - **Value:** Connection string จาก Supabase (port 6543)
   - **Environment:** เลือก **Production**, **Preview**, **Development**
6. **Save**

#### ขั้นตอนที่ 4: Redeploy

1. ไปที่ **Deployments** tab
2. คลิก **⋯** (three dots) บน deployment ล่าสุด
3. เลือก **Redeploy**

หรือ push code ใหม่:
```bash
git commit --allow-empty -m "Trigger redeploy after DATABASE_URL fix"
git push
```

#### ขั้นตอนที่ 5: ทดสอบ Connection

หลังจาก redeploy แล้ว:
```
https://dev.zablink.com/api/debug/connection
```

---

## 🔍 Debug Endpoints

### 1. Comprehensive Connection Test
```
/api/debug/connection
```
- ตรวจสอบ connection status
- แสดง connection type
- ทดสอบ basic query, table check, shop count

### 2. Network Connectivity Test
```
/api/debug/network
```
- ทดสอบ network connectivity
- วิเคราะห์ error type
- แสดง recommendations

### 3. Environment Variables Check
```
/api/debug/env
```
- ตรวจสอบ DATABASE_URL configuration
- แสดง connection type และ port
- แสดง recommendations

---

## 📋 Checklist

### Local Development:
- [ ] `.env` file มี `DATABASE_URL` ใช้ port **5432** (direct connection)
- [ ] ไม่มี `?pgbouncer=true` ใน connection string
- [ ] Restart development server หลังจากเปลี่ยน `.env`
- [ ] `/api/debug/connection` แสดง `connectionStatus: "connected"`

### Vercel Production:
- [ ] Supabase project status เป็น **Active** (ไม่ใช่ Paused)
- [ ] Vercel Environment Variables มี `DATABASE_URL` ใช้ port **6543** (pooler)
- [ ] Connection string มี `?pgbouncer=true`
- [ ] Redeploy หลังจากเปลี่ยน Environment Variables
- [ ] `/api/debug/connection` แสดง `connectionStatus: "connected"`

---

## 🆘 ถ้ายังไม่ได้

### 1. ตรวจสอบ Supabase SQL Editor

ลองเชื่อมต่อผ่าน Supabase Dashboard:
1. ไปที่ **SQL Editor**
2. รัน query: `SELECT 1;`
3. ถ้าได้ผล → Database ทำงานปกติ
4. ถ้าไม่ได้ → Project อาจจะถูก pause หรือมีปัญหา

### 2. ตรวจสอบ Network

ลอง ping database host:
```bash
ping db.gysckclnnitkgafvdkno.supabase.co
```

หรือใช้ `telnet`:
```bash
telnet db.gysckclnnitkgafvdkno.supabase.co 5432
# หรือ
telnet db.gysckclnnitkgafvdkno.supabase.co 6543
```

### 3. ตรวจสอบ Password

1. ไปที่ Supabase Dashboard → **Settings** → **Database**
2. คลิก **Reset Database Password** (ถ้าจำเป็น)
3. Copy password ใหม่
4. อัพเดท `DATABASE_URL` ใน `.env` หรือ Vercel

### 4. ลองใช้ Pooler Subdomain

แทนที่จะใช้:
```
db.xxx.supabase.co:6543
```

ลองใช้:
```
pooler.xxx.supabase.co:5432?pgbouncer=true
```

---

## 📚 Related Documentation

- `DEBUG_CONNECTION_GUIDE.md` - คู่มือ debug connection
- `FIX_DATABASE_CONNECTION.md` - แก้ไข connection error
- `VERCEL_DATABASE_SETUP.md` - ตั้งค่า database ใน Vercel
