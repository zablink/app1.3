# แก้ไข Error: redirect_uri mismatch

## 🔍 ปัญหา

Error `redirect_uri` หมายความว่า redirect URI ที่ส่งไปให้ TikTok ไม่ตรงกับที่ตั้งค่าใน TikTok Developer Portal

## ✅ วิธีแก้ไข

### วิธีที่ 1: ตั้งค่า TIKTOK_REDIRECT_URI ใน Vercel (แนะนำ)

1. ไปที่ **Vercel Dashboard** > **Project** > **Settings** > **Environment Variables**
2. เพิ่ม environment variable ใหม่:
   ```
   TIKTOK_REDIRECT_URI=https://www.zablink.com/api/auth/tiktok/callback
   ```
3. **สำคัญ**: ต้องตรงกับที่ตั้งค่าใน TikTok Developer Portal **ทุกตัวอักษร**
4. กด **Save**
5. **Redeploy** application

### วิธีที่ 2: ตั้งค่า NEXT_PUBLIC_APP_URL ใน Vercel

1. ไปที่ **Vercel Dashboard** > **Project** > **Settings** > **Environment Variables**
2. เพิ่มหรือแก้ไข environment variable:
   ```
   NEXT_PUBLIC_APP_URL=https://www.zablink.com
   ```
3. **สำคัญ**: 
   - ต้องไม่มี trailing slash (`/`) ที่ท้าย
   - ต้องตรงกับ domain ที่ตั้งค่าใน TikTok Developer Portal
4. กด **Save**
5. **Redeploy** application

### วิธีที่ 3: ตรวจสอบและแก้ไขใน TikTok Developer Portal

1. ไปที่ [TikTok Developer Portal](https://developers.tiktok.com/)
2. เลือก App ของคุณ
3. ไปที่ **Basic Information** หรือ **Platform Settings**
4. ตรวจสอบ **Web/Desktop URL** ว่าเป็น:
   ```
   https://www.zablink.com/api/auth/tiktok/callback
   ```
5. **สำคัญ**: 
   - ต้องตรงกับ redirect_uri ที่ส่งไปจากโค้ด **ทุกตัวอักษร**
   - ต้องไม่มี trailing slash (`/`) ที่ท้าย
   - ต้องเป็น `https` (ไม่ใช่ `http`)

## 🔍 วิธีตรวจสอบ Redirect URI ที่ส่งไปจริง

### ตรวจสอบ Vercel Logs

1. ไปที่ **Vercel Dashboard** > **Project** > **Logs**
2. กดปุ่ม TikTok อีกครั้ง
3. ดู log ที่แสดง:
   ```
   === TikTok OAuth Configuration ===
   Final Redirect URI: https://...
   ```
4. ตรวจสอบว่า redirect URI ที่แสดงตรงกับที่ตั้งค่าใน TikTok Developer Portal หรือไม่

### ตรวจสอบ Environment Variables

ตรวจสอบว่า environment variables ถูกตั้งค่าถูกต้อง:

```
✅ TIKTOK_REDIRECT_URI=https://www.zablink.com/api/auth/tiktok/callback
   หรือ
✅ NEXT_PUBLIC_APP_URL=https://www.zablink.com
```

## ⚠️ ข้อควรระวัง

### 1. Domain ต้องตรงกันทุกตัวอักษร

❌ **ผิด**:
- TikTok Portal: `https://www.zablink.com/api/auth/tiktok/callback`
- Code ส่งไป: `https://zablink.com/api/auth/tiktok/callback` (ไม่มี www)

✅ **ถูกต้อง**:
- TikTok Portal: `https://www.zablink.com/api/auth/tiktok/callback`
- Code ส่งไป: `https://www.zablink.com/api/auth/tiktok/callback`

### 2. Protocol ต้องเป็น HTTPS

❌ **ผิด**: `http://www.zablink.com/api/auth/tiktok/callback`
✅ **ถูกต้อง**: `https://www.zablink.com/api/auth/tiktok/callback`

### 3. ไม่มี Trailing Slash

❌ **ผิด**: `https://www.zablink.com/api/auth/tiktok/callback/`
✅ **ถูกต้อง**: `https://www.zablink.com/api/auth/tiktok/callback`

### 4. Case Sensitive

URL ต้องตรงกันทุกตัวอักษร รวมถึงตัวพิมพ์เล็ก-ใหญ่

## 📋 Checklist

- [ ] `TIKTOK_REDIRECT_URI` หรือ `NEXT_PUBLIC_APP_URL` ตั้งค่าใน Vercel แล้ว
- [ ] Redirect URI ใน TikTok Developer Portal ตรงกับที่ส่งไปจากโค้ด
- [ ] Domain ตรงกันทุกตัวอักษร (รวมถึง www)
- [ ] Protocol เป็น `https` (ไม่ใช่ `http`)
- [ ] ไม่มี trailing slash (`/`) ที่ท้าย
- [ ] Redeploy application หลังจากแก้ไข environment variables

## 🐛 Debugging

หากยังมีปัญหา:

1. **ตรวจสอบ Vercel Logs**
   - ดู `Final Redirect URI` ใน log
   - เปรียบเทียบกับที่ตั้งค่าใน TikTok Developer Portal

2. **ตรวจสอบ Environment Variables**
   - ตรวจสอบว่า `TIKTOK_REDIRECT_URI` หรือ `NEXT_PUBLIC_APP_URL` ถูกตั้งค่าแล้ว
   - ตรวจสอบว่าไม่มี trailing slash

3. **ตรวจสอบ TikTok Developer Portal**
   - ตรวจสอบว่า Web/Desktop URL ตรงกับ redirect URI ที่ส่งไป
   - ลองลบและเพิ่มใหม่

4. **ทดสอบด้วย curl**
   ```bash
   curl -I https://www.zablink.com/api/auth/tiktok/authorize
   ```
   ตรวจสอบว่า endpoint ทำงานได้

## 💡 คำแนะนำ

- **ใช้ `TIKTOK_REDIRECT_URI`**: ตั้งค่า redirect URI โดยตรงเพื่อความแน่นอน
- **ตรวจสอบ Logs**: ดู redirect URI ที่ส่งไปจริงใน Vercel Logs
- **Redeploy**: หลังจากแก้ไข environment variables ต้อง redeploy
