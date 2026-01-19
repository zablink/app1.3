# 🚀 Deploy Instructions สำหรับ Vercel

## ⚠️ แก้ไข Error: "The table `public.User` does not exist"

### สาเหตุ
Database บน production (Supabase) ยังไม่มีตารางที่จำเป็น หรือชื่อตารางไม่ตรงกับ Prisma schema

---

## 📋 วิธีแก้ไข

### Option 1: รัน Migration บน Production (แนะนำ)

```bash
# 1. ตั้งค่า DATABASE_URL ของ production
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.vygryagvxjewxdzgipea.supabase.co:5432/postgres"

# 2. รัน migrations
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate
```

### Option 2: ใช้ Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Pull environment variables
vercel env pull .env.local

# 5. รัน migration
npx prisma migrate deploy

# 6. Redeploy
vercel --prod
```

### Option 3: ใช้ Supabase SQL Editor (เร็วที่สุด)

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor**
4. รันคำสั่งนี้:

```sql
-- ตรวจสอบว่ามีตาราง User หรือไม่
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%' OR table_name LIKE '%User%';

-- ถ้าเป็นชื่ออื่น เช่น 'users' ให้เพิ่ม @@map ใน schema.prisma
```

---

## 🔧 แก้ไข Prisma Schema (ถ้าตารางมีชื่อต่าง)

หากตารางในฐานข้อมูลชื่อ `users` (lowercase) แทนที่จะเป็น `User`:

```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  password      String?
  image         String?
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  shops         Shop[]
  accounts      Account[]
  sessions      Session[]
  reviewers     Reviewer[]

  @@map("users")  // เพิ่มบรรทัดนี้
}

model Account {
  // ... existing fields
  
  @@map("accounts")  // เพิ่มถ้ายังไม่มี
}

model Session {
  // ... existing fields
  
  @@map("sessions")  // เพิ่มถ้ายังไม่มี
}
```

หลังจากแก้แล้ว:
```bash
npx prisma generate
git add .
git commit -m "Fix: Add table mappings for production"
git push origin dev
```

---

## 🗄️ ตรวจสอบชื่อตารางที่มีอยู่

รันใน Supabase SQL Editor:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

---

## ✅ Checklist หลัง Deploy

- [ ] Database มีตารางครบถ้วน
- [ ] User table มี column `role` แล้ว
- [ ] มี SiteSetting และ HeroBanner tables
- [ ] Environment Variables ถูกต้อง:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] สร้าง Admin user (role = 'ADMIN')
- [ ] Insert default banners

---

## 🔐 สร้าง Admin User

รันใน Supabase SQL Editor:

```sql
-- อัปเดต user ที่มีอยู่ให้เป็น ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- หรือถ้าใช้ตาราง users (lowercase)
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

---

## 🎨 Insert Default Hero Banners

```sql
INSERT INTO hero_banners (id, title, subtitle, cta_label, cta_link, image_url, priority, is_active, created_at, updated_at) VALUES
  ('hb_001', 'ยินดีต้อนรับสู่ Zablink', 'ค้นหาร้านค้าและบริการที่คุณชื่นชอบได้ง่ายๆ ในพื้นที่ใกล้คุณ', 'เริ่มค้นหา', '/search', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=600&fit=crop', 100, true, NOW(), NOW()),
  ('hb_002', 'ค้นพบร้านอาหารใกล้คุณ', 'รีวิวจากผู้ใช้งานจริง พร้อมโปรโมชั่นพิเศษ', 'ดูร้านอาหาร', '/search?category=food', 90, true, NOW(), NOW()),
  ('hb_003', 'ลงทะเบียนร้านค้าของคุณ', 'เพิ่มโอกาสทางธุรกิจด้วยการลงทะเบียนร้านค้าฟรี', 'เริ่มต้นเลย', '/shop/register', 80, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

---

## 📞 ติดต่อ Support

หากยังมีปัญหา ตรวจสอบ:
1. Vercel Logs: `vercel logs`
2. Database connection: ทดสอบใน Prisma Studio
3. Environment variables: ตรวจสอบว่าครบและถูกต้อง

---

สร้างเมื่อ: 19 พฤศจิกายน 2025
