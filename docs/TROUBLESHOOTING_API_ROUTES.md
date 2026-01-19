# API Routes Troubleshooting Guide

## ปัญหาที่พบและวิธีแก้ไข

### 🚨 Error: "You cannot use different slug names for the same dynamic path"

**อาการ:**
- API endpoint ค้างไม่ตอบกลับ (timeout)
- Vercel logs แสดง error: `'id' !== 'slug'`
- เปิด URL API โดยตรงก็ไม่ได้

**สาเหตุ:**
Next.js **ไม่อนุญาต** ให้มี dynamic routes 2 ตัวที่ระดับเดียวกัน เช่น:
```
❌ /api/categories/[id]/route.ts
❌ /api/categories/[slug]/route.ts
```

**วิธีแก้:**
แยก path ออกจากกัน:
```
✅ /api/categories/[id]/route.ts     → /api/categories/123
✅ /api/category/[slug]/route.ts     → /api/category/food-drink
```

**ขั้นตอนแก้ไข:**
1. ย้ายไฟล์ที่ conflict ไปยัง path ใหม่
2. แก้ไข code ที่เรียกใช้ API
3. Commit & push
4. Redeploy with clear cache

---

### 🐌 API Endpoint ช้าหรือ Timeout

**สาเหตุที่เป็นไปได้:**
1. **Prisma query ที่ซับซ้อน** - `_count`, `include` หลายชั้น
2. **Database connection timeout**
3. **Circular import** - import `authOptions` ที่มี dependency loop

**วิธีแก้:**
1. **ลดความซับซ้อนของ query:**
   ```typescript
   // ❌ ช้า - count แบบ include
   include: { _count: { select: { shops: true } } }
   
   // ✅ เร็ว - select เฉพาะที่ต้องการ
   select: { id: true, name: true, slug: true, icon: true }
   ```

2. **เพิ่ม dynamic config:**
   ```typescript
   export const dynamic = 'force-dynamic';
   export const runtime = 'nodejs';
   ```

3. **Test แบบ bypass database:**
   ```typescript
   // Test ว่า API route ทำงานไหม
   return NextResponse.json({ test: 'ok' });
   ```

---

### 📋 Checklist เมื่อสร้าง API Route ใหม่

- [ ] ชื่อไฟล์ต้องเป็น `route.ts` (ไม่ใช่ `routes.ts`)
- [ ] ไม่มี dynamic routes ซ้ำกันใน path เดียวกัน
- [ ] เพิ่ม error handling (`try-catch`)
- [ ] Return `NextResponse.json()` เสมอ
- [ ] ถ้าใช้ Prisma ให้ `select` เฉพาะฟิลด์ที่ต้องการ
- [ ] Test ใน local ก่อน deploy

---

### 🔍 วิธี Debug API ที่มีปัญหา

**1. เช็ค Vercel Logs:**
```
Deployments → Latest → Runtime Logs
```

**2. Test API โดยตรง:**
```
https://your-domain.com/api/your-endpoint
```

**3. เพิ่ม Console Logs:**
```typescript
export async function GET() {
  console.log('🚀 API called');
  try {
    console.log('📊 Before query');
    const data = await prisma...
    console.log('✅ Query success:', data.length);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

**4. ลองทีละขั้น:**
- ขั้นที่ 1: Return static data (bypass database)
- ขั้นที่ 2: Query database แบบง่าย
- ขั้นที่ 3: เพิ่ม complexity ทีละน้อย

---

### ⚠️ Common Mistakes

1. **ใช้ชื่อ dynamic param ซ้ำกัน** - `[id]` vs `[slug]` ใน path เดียวกัน
2. **ลืม export function** - ต้อง `export async function GET/POST/PUT/DELETE`
3. **Import ผิด** - ใช้ `{ prisma }` แทน `default import`
4. **ไม่มี error handling** - ทำให้ debug ยาก
5. **Cache issues** - ลืมเพิ่ม `dynamic = 'force-dynamic'`

---

### 📝 Best Practices

1. **ตั้งชื่อ API ให้สื่อความหมาย:**
   ```
   /api/categories      → GET all
   /api/categories/[id] → GET/PUT/DELETE by ID
   /api/category/[slug] → GET by slug (ใช้เอกพจน์แยกจาก categories)
   ```

2. **Select เฉพาะฟิลด์ที่ต้องการ:**
   ```typescript
   select: { id: true, name: true, slug: true }
   ```

3. **ใช้ try-catch ทุก route:**
   ```typescript
   try {
     // logic
   } catch (error) {
     console.error('Error:', error);
     return NextResponse.json({ error: 'Message' }, { status: 500 });
   }
   ```

4. **Test ใน local ก่อน:**
   ```bash
   npm run dev
   # เปิด http://localhost:3000/api/your-endpoint
   ```

---

## เคสที่เจอวันนี้ (25 Nov 2025)

**ปัญหา:** หน้า admin/categories โหลดไม่ขึ้น API timeout

**สาเหตุ:** 
- มี `/api/categories/[id]` และ `/api/categories/[slug]` conflict กัน
- Next.js ไม่สามารถ resolve route ได้

**วิธีแก้:**
```bash
# ย้าย [slug] ไปยัง path แยก
mv src/app/api/categories/[slug] src/app/api/category/

# แก้ไขไฟล์ที่เรียกใช้
# จาก: fetch(`/api/categories/${slug}`)
# เป็น: fetch(`/api/category/${slug}`)
```

**เวลาที่ใช้:** ~3 ชั่วโมง (สามารถลดเหลือ 15 นาทีถ้ารู้ปัญหาตั้งแต่แรก)

---

## สรุป

✅ **ก่อนสร้าง API route ใหม่:**
1. เช็คว่าไม่มี dynamic param ซ้ำกัน
2. ตั้งชื่อให้ชัดเจนและไม่ conflict
3. เพิ่ม error handling ครบ
4. Test ใน local ก่อน deploy

✅ **เมื่อมีปัญหา:**
1. เช็ค Vercel logs หา error message
2. Test API โดยตรงใน browser
3. Bypass database test ก่อน
4. เพิ่ม console.log เพื่อ track flow

**อย่าลืม:** Next.js App Router มีกฎเกณฑ์เข้มงวดเรื่อง routing - ถ้าไม่แน่ใจให้ test ก่อนเสมอ!
