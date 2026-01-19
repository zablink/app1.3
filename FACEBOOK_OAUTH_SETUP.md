# 🔐 Facebook OAuth Setup Guide

## 📋 Redirect URI ที่ต้องตั้งค่าใน Facebook App

### สำหรับ NextAuth.js
NextAuth.js จะใช้ redirect URI ในรูปแบบ:
```
{NEXTAUTH_URL}/api/auth/callback/facebook
```

### ตัวอย่าง Redirect URIs

#### Development (localhost)
```
http://localhost:3000/api/auth/callback/facebook
```

#### Production
```
https://yourdomain.com/api/auth/callback/facebook
```

---

## 🛠️ วิธีตั้งค่าใน Facebook Developers

### ขั้นตอนที่ 1: เปิด Facebook Login Product
1. ไปที่ [Facebook Developers](https://developers.facebook.com/)
2. เลือก App ของคุณ
3. ไปที่ **Products** → คลิก **+ Add Product**
4. เลือก **Facebook Login** → คลิก **Set Up**

### ขั้นตอนที่ 2: ตั้งค่า Valid OAuth Redirect URIs
1. ไปที่ **Products** → **Facebook Login** → **Settings**
2. ในส่วน **Valid OAuth Redirect URIs** ให้เพิ่ม:

   **สำหรับ Development:**
   ```
   http://localhost:3000/api/auth/callback/facebook
   ```

   **สำหรับ Production:**
   ```
   https://yourdomain.com/api/auth/callback/facebook
   ```

3. **สำคัญ:** ต้องใส่ทั้ง `http://` และ `https://` ถ้าใช้ทั้งสองแบบ
4. **สำคัญ:** ต้องใส่ทั้ง `www.yourdomain.com` และ `yourdomain.com` ถ้าใช้ทั้งสองแบบ

### ขั้นตอนที่ 3: เปิดใช้งาน OAuth Login
1. ในหน้า **Settings** ของ Facebook Login
2. ตรวจสอบว่า:
   - ✅ **Client OAuth Login** = **Yes**
   - ✅ **Web OAuth Login** = **Yes**
   - ✅ **Use Strict Mode for Redirect URIs** = **Yes** (แนะนำ)

### ขั้นตอนที่ 4: ตั้งค่า App Domains
1. ไปที่ **Settings** → **Basic**
2. ในส่วน **App Domains** ให้เพิ่ม:
   - `localhost` (สำหรับ development)
   - `yourdomain.com` (สำหรับ production)

### ขั้นตอนที่ 5: ตั้งค่า Site URL
1. ในหน้า **Settings** → **Basic**
2. ในส่วน **Site URL** ให้ใส่:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

---

## ⚠️ ข้อควรระวัง

### 1. Protocol ต้องตรงกัน
- ถ้าใช้ `https://` ใน production ต้องใส่ `https://` ใน Facebook settings
- ถ้าใช้ `http://` ใน development ต้องใส่ `http://` ใน Facebook settings

### 2. Trailing Slash
- **ไม่ต้องใส่** trailing slash (`/`) ที่ท้าย URL
- ✅ ถูก: `https://yourdomain.com/api/auth/callback/facebook`
- ❌ ผิด: `https://yourdomain.com/api/auth/callback/facebook/`

### 3. App Mode
- ถ้า App อยู่ในโหมด **Development** สามารถใช้ `localhost` ได้
- ถ้า App อยู่ในโหมด **Live** จะใช้ได้เฉพาะ production domain เท่านั้น

### 4. Multiple Environments
ถ้าต้องการรองรับหลาย environment ให้เพิ่มทั้งหมด:
```
http://localhost:3000/api/auth/callback/facebook
https://staging.yourdomain.com/api/auth/callback/facebook
https://yourdomain.com/api/auth/callback/facebook
```

---

## 🔍 วิธีตรวจสอบ Redirect URI ที่ใช้จริง

### วิธีที่ 1: ใช้ Debug Endpoint (แนะนำ)
เรียกใช้ endpoint นี้เพื่อดู redirect URI ที่ใช้:
```
GET /api/debug/facebook-redirect-uri
```

หรือเปิดในเบราว์เซอร์:
- Development: `http://localhost:3000/api/debug/facebook-redirect-uri`
- Preview/Production: `https://yourdomain.com/api/debug/facebook-redirect-uri`

Endpoint นี้จะแสดง:
- Redirect URI ที่ใช้จริง
- Preview URL (ถ้าใช้ Vercel preview)
- Environment variables ที่เกี่ยวข้อง
- คำแนะนำในการตั้งค่า

### วิธีที่ 2: ดูจาก Browser Console
1. เปิด Browser Developer Tools (F12)
2. ไปที่ Console tab
3. กดปุ่ม Login with Facebook
4. ดู URL ที่ถูก redirect ไป

### วิธีที่ 3: ตรวจสอบ Environment Variables
ตรวจสอบว่า `NEXTAUTH_URL` ตั้งค่าถูกต้อง:
```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://yourdomain.com
```

---

## 🚀 สำหรับ Vercel Preview Deployments

### ⚠️ ปัญหาที่พบบ่อย: Preview URL ไม่ได้ถูก Whitelist

ถ้าคุณ deploy บน Vercel และใช้ **Preview Deployment** (เช่น `xxx.vercel.app`), คุณต้อง:

### 1. ตรวจสอบ Preview URL
เรียกใช้ debug endpoint:
```
GET /api/debug/facebook-redirect-uri
```

ดูค่า `previewUrl` ใน response

### 2. เพิ่ม Preview URL ใน Facebook
1. ไปที่ Facebook Developers → Your App → Products → Facebook Login → Settings
2. ในส่วน "Valid OAuth Redirect URIs" ให้เพิ่ม:
   ```
   https://xxx.vercel.app/api/auth/callback/facebook
   ```
   (แทนที่ `xxx.vercel.app` ด้วย preview URL จริงของคุณ)

### 3. ตรวจสอบ Facebook App Mode
⚠️ **สำคัญ:** Facebook App ต้องอยู่ในโหมด **Development** เพื่อให้ใช้ preview URLs ได้

- ✅ **Development Mode**: ใช้ได้กับ `localhost` และ preview URLs
- ❌ **Live Mode**: ใช้ได้เฉพาะ production domains เท่านั้น

**วิธีเปลี่ยน App Mode:**
1. ไปที่ Facebook Developers → Your App → Settings → Basic
2. ดูที่ "App Mode" section
3. ถ้าเป็น "Live" และต้องการทดสอบ preview ให้เปลี่ยนเป็น "Development" ชั่วคราว

### 4. ตั้งค่า NEXTAUTH_URL สำหรับ Preview (Optional)
ถ้าต้องการให้ NextAuth ใช้ URL เฉพาะสำหรับ preview:

ใน Vercel Environment Variables:
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://xxx.vercel.app` (สำหรับ preview environment)
- **Environment:** เลือก **Preview** เท่านั้น

⚠️ **หมายเหตุ:** ถ้าไม่ตั้ง `NEXTAUTH_URL` NextAuth จะใช้ request origin อัตโนมัติ ซึ่งก็ใช้งานได้ปกติ

---

## 🐛 Troubleshooting

### ปัญหา: "URL blocked" Error
**สาเหตุ:** Redirect URI ไม่ได้ถูก whitelist

**วิธีแก้:**
1. ตรวจสอบว่าได้เพิ่ม redirect URI ใน Facebook App settings แล้ว
2. ตรวจสอบว่า protocol (`http://` vs `https://`) ตรงกัน
3. ตรวจสอบว่าไม่มี trailing slash
4. รอสักครู่ (Facebook อาจใช้เวลาในการอัปเดต settings)

### ปัญหา: "Invalid OAuth Access Token"
**สาเหตุ:** Client ID หรือ Client Secret ไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบ `FACEBOOK_CLIENT_ID` และ `FACEBOOK_CLIENT_SECRET` ใน environment variables
2. ตรวจสอบว่า App ID และ App Secret ใน Facebook App ถูกต้อง

### ปัญหา: "App Not Setup"
**สาเหตุ:** Facebook Login product ยังไม่ได้ถูก setup

**วิธีแก้:**
1. ไปที่ Products → เพิ่ม Facebook Login
2. ทำตามขั้นตอนการ setup

---

## 📝 Checklist

- [ ] เพิ่ม Facebook Login product ใน Facebook App
- [ ] ตั้งค่า Valid OAuth Redirect URIs
- [ ] เปิด Client OAuth Login
- [ ] เปิด Web OAuth Login
- [ ] ตั้งค่า App Domains
- [ ] ตั้งค่า Site URL
- [ ] ตั้งค่า `NEXTAUTH_URL` ใน environment variables
- [ ] ตั้งค่า `FACEBOOK_CLIENT_ID` ใน environment variables
- [ ] ตั้งค่า `FACEBOOK_CLIENT_SECRET` ใน environment variables
- [ ] ทดสอบ login ใน development
- [ ] ทดสอบ login ใน production

---

## 🔗 Links ที่เกี่ยวข้อง

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [NextAuth.js Facebook Provider](https://next-auth.js.org/providers/facebook)
- [Facebook App Settings](https://developers.facebook.com/apps/)
