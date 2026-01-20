# TikTok OAuth Redirect URI Setup Guide

## ปัญหาที่พบบ่อย: "redirect_uri mismatch"

หากคุณเห็น error message:
```
We couldn't log in with TikTok. This may be due to specific app settings.
redirect_uri
```

นี่หมายความว่า redirect URI ที่ส่งไปให้ TikTok ไม่ตรงกับที่ตั้งค่าใน TikTok Developer Portal

## วิธีแก้ไข

### 1. ตรวจสอบ Redirect URI ในโค้ด

Redirect URI ที่โค้ดใช้คือ:
```
https://your-domain.com/api/auth/tiktok/callback
```

**สำคัญ**: 
- ต้องไม่มี trailing slash (`/`) ที่ท้าย
- ต้องเป็น `https` (ไม่ใช่ `http`)
- ต้องตรงกับ URL จริงของเว็บคุณใน Vercel

### 2. ตั้งค่าใน TikTok Developer Portal

1. ไปที่ [TikTok Developer Portal](https://developers.tiktok.com/)
2. เลือก App ของคุณ
3. ไปที่ **Basic Information** หรือ **Platform Settings**
4. หาส่วน **Redirect URI** หรือ **Callback URL**
5. เพิ่ม redirect URI ตามนี้:

```
https://your-domain.vercel.app/api/auth/tiktok/callback
```

**ตัวอย่าง**:
- ถ้า domain ของคุณคือ `myapp.vercel.app` → ใส่ `https://myapp.vercel.app/api/auth/tiktok/callback`
- ถ้า domain ของคุณคือ `www.myapp.com` → ใส่ `https://www.myapp.com/api/auth/tiktok/callback`

### 3. ตรวจสอบ Environment Variables ใน Vercel

ตรวจสอบว่า `NEXT_PUBLIC_APP_URL` ตั้งค่าถูกต้อง:

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**สำคัญ**:
- ต้องไม่มี trailing slash (`/`) ที่ท้าย
- ต้องเป็น `https` (ไม่ใช่ `http`)
- ต้องตรงกับ URL จริงของเว็บคุณ

### 4. ตรวจสอบ App Status

ใน TikTok Developer Portal:
- App Status ต้องเป็น **"Staging"** หรือ **"Live"**
- ถ้ายังเป็น **"Draft"** จะใช้งานไม่ได้

### 5. ตรวจสอบ Redirect URI Format

Redirect URI ต้องตรงกันทุกตัวอักษร:

✅ **ถูกต้อง**:
```
https://myapp.vercel.app/api/auth/tiktok/callback
```

❌ **ผิด**:
```
https://myapp.vercel.app/api/auth/tiktok/callback/  (มี trailing slash)
http://myapp.vercel.app/api/auth/tiktok/callback   (ใช้ http แทน https)
https://myapp.vercel.app/api/auth/tiktok/callbacks  (สะกดผิด)
```

### 6. ตรวจสอบ Logs ใน Vercel

หลังจากแก้ไขแล้ว:
1. ไปที่ Vercel Dashboard > Project > Logs
2. กดปุ่ม TikTok อีกครั้ง
3. ดู log ที่แสดง `TikTok OAuth redirect URI:` 
4. ตรวจสอบว่า redirect URI ที่แสดงตรงกับที่ตั้งค่าใน TikTok Developer Portal หรือไม่

### 7. Redeploy หลังจากแก้ไข Environment Variables

หลังจากแก้ไข `NEXT_PUBLIC_APP_URL` ใน Vercel:
1. กด **Save**
2. **Redeploy** application เพื่อให้ค่าใหม่มีผล

## Checklist

- [ ] `NEXT_PUBLIC_APP_URL` ตั้งค่าใน Vercel แล้ว (ไม่มี trailing slash)
- [ ] Redirect URI ใน TikTok Developer Portal ตรงกับ `https://your-domain/api/auth/tiktok/callback`
- [ ] App Status ใน TikTok Developer Portal เป็น "Staging" หรือ "Live"
- [ ] Redeploy application หลังจากแก้ไข environment variables
- [ ] ตรวจสอบ logs ใน Vercel เพื่อดู redirect URI ที่ส่งไปจริง

## ตัวอย่างการตั้งค่า

### Environment Variables ใน Vercel:
```
NEXT_PUBLIC_APP_URL=https://myapp.vercel.app
TIKTOK_CLIENT_ID=your_client_id
TIKTOK_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=https://myapp.vercel.app
NEXTAUTH_SECRET=your_secret
```

### Redirect URI ใน TikTok Developer Portal:
```
https://myapp.vercel.app/api/auth/tiktok/callback
```

## ยังแก้ไม่ได้?

หากยังมีปัญหา:
1. ตรวจสอบ Vercel Logs เพื่อดู redirect URI ที่ส่งไปจริง
2. ตรวจสอบว่า redirect URI ใน TikTok Developer Portal ตรงกับ log หรือไม่
3. ลองลบ redirect URI เก่าใน TikTok Developer Portal แล้วเพิ่มใหม่
4. ตรวจสอบว่า App Status เป็น "Staging" หรือ "Live"
