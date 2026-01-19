# 🚀 คู่มือ Deploy จาก Dev Branch ไป Production

## 📋 สรุป

- **Dev Branch:** `dev` (preview/pre-development)
- **Production Branch:** `main` (production)
- **Deployment Platform:** Vercel

---

## ✅ ขั้นตอนการ Deploy ไป Production

### ขั้นตอนที่ 1: Commit และ Push Changes ใน Dev Branch

ก่อนจะ merge ตรวจสอบว่ามี uncommitted changes หรือไม่:

```bash
# ตรวจสอบสถานะ
git status

# ถ้ามี files ที่ยังไม่ได้ commit (เช่น FACEBOOK_OAUTH_SETUP.md, debug endpoint)
# ให้ commit ก่อน:

git add .
git commit -m "Add Facebook OAuth setup guide and debug endpoint"

# Push dev branch ไป remote
git push origin dev
```

### ขั้นตอนที่ 2: Switch ไป Main Branch

```bash
# Switch ไป main branch
git checkout main

# Pull latest changes จาก remote (เพื่อให้แน่ใจว่ามี code ล่าสุด)
git pull origin main
```

### ขั้นตอนที่ 3: Merge Dev Branch ไป Main

```bash
# Merge dev branch เข้า main
git merge dev

# ถ้ามี conflicts จะต้องแก้ไข conflicts ก่อน
# หลังจากแก้ไข conflicts แล้ว:
# git add .
# git commit -m "Merge dev to main: resolve conflicts"
```

### ขั้นตอนที่ 4: Push Main Branch ไป Remote

```bash
# Push main branch ไป remote (จะ trigger Vercel deployment)
git push origin main
```

---

## 🔄 วิธีแบบเต็ม (All-in-One)

```bash
# 1. ตรวจสอบว่าอยู่บน dev branch และมี uncommitted changes หรือไม่
git status

# 2. Commit changes (ถ้ามี)
git add .
git commit -m "Prepare for production deployment"

# 3. Push dev branch
git push origin dev

# 4. Switch ไป main
git checkout main

# 5. Pull latest main
git pull origin main

# 6. Merge dev เข้า main
git merge dev

# 7. Push main (จะ trigger Vercel production deployment)
git push origin main
```

---

## 📝 แนะนำ: ใช้ Merge Commit Message ที่ชัดเจน

```bash
git merge dev -m "Merge dev to main: Deploy to production

- Add Facebook OAuth setup guide
- Add Facebook redirect URI debug endpoint
- Update authentication configuration"
```

---

## ⚠️ ถ้ามี Merge Conflicts

```bash
# 1. หลังจาก merge ถ้ามี conflicts
git merge dev

# 2. Git จะบอกว่ามี conflicts ในไฟล์ไหนบ้าง
# 3. เปิดไฟล์ที่มี conflicts และแก้ไข
# 4. หลังจากแก้ไขเสร็จ:

git add .
git commit -m "Merge dev to main: resolve conflicts"
git push origin main
```

---

## 🚀 Vercel Auto-Deployment

หลังจาก push `main` branch ไป remote แล้ว:

1. **Vercel จะ auto-deploy** production deployment จาก `main` branch
2. ตรวจสอบ deployment ที่ [Vercel Dashboard](https://vercel.com/dashboard)
3. รอให้ build สำเร็จ (อาจใช้เวลา 2-5 นาที)

---

## 🔍 ตรวจสอบ Deployment

### 1. ตรวจสอบ Vercel Dashboard
- ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
- เลือก Project ของคุณ
- ดู **Deployments** tab
- ตรวจสอบว่า deployment จาก `main` branch สำเร็จ

### 2. ตรวจสอบ Production URL
- ทดสอบ URL ของ production
- ตรวจสอบว่า website ทำงานปกติ

---

## 📋 Checklist ก่อน Deploy

- [ ] ทดสอบทุกอย่างใน dev branch แล้ว
- [ ] Commit และ push ทุก changes ใน dev branch
- [ ] ตรวจสอบว่า environment variables ใน Vercel ตั้งค่าถูกต้อง:
  - [ ] `NEXTAUTH_URL` = production domain
  - [ ] `FACEBOOK_CLIENT_ID` และ `FACEBOOK_CLIENT_SECRET` ตั้งค่าแล้ว
  - [ ] `DATABASE_URL` ใช้ connection pooler (port 6543)
- [ ] ตรวจสอบว่า Facebook App settings มี production redirect URI:
  - [ ] `https://yourdomain.com/api/auth/callback/facebook`
- [ ] Merge dev ไป main
- [ ] Push main branch
- [ ] ตรวจสอบ Vercel deployment สำเร็จ
- [ ] ทดสอบ production website

---

## 🔄 วิธี Rollback (ถ้าเกิดปัญหา)

ถ้า deployment มีปัญหาและต้องการ rollback:

```bash
# 1. ไปที่ Vercel Dashboard → Deployments
# 2. เลือก deployment ก่อนหน้าที่ทำงานปกติ
# 3. คลิก "..." → "Promote to Production"

# หรือใช้ git:

# 1. ดู commit history
git log --oneline

# 2. Reset ไป commit ก่อนหน้า
git reset --hard <previous-commit-hash>

# 3. Force push (ระวัง! ใช้กับ caution)
git push origin main --force
```

---

## 💡 Tips

### 1. ใช้ Pull Request (PR) แทน Direct Merge
ถ้าต้องการความปลอดภัยมากขึ้น:

```bash
# 1. Push dev branch
git push origin dev

# 2. ไปที่ GitHub/GitLab และสร้าง Pull Request จาก dev → main
# 3. Review code และ merge ผ่าน web interface
```

### 2. ใช้ Git Tags สำหรับ Versioning

```bash
# หลังจาก merge สำเร็จ
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### 3. ตรวจสอบก่อน Merge

```bash
# ดู diff ระหว่าง dev และ main
git diff main..dev

# ดู summary
git diff --stat main..dev
```

---

## 🆘 Troubleshooting

### ปัญหา: "Your branch is ahead of origin/main"
**วิธีแก้:** Push main branch
```bash
git push origin main
```

### ปัญหา: "Merge conflicts"
**วิธีแก้:** แก้ไข conflicts แล้ว commit
```bash
# แก้ไข conflicts ในไฟล์
git add .
git commit -m "Resolve merge conflicts"
```

### ปัญหา: "Permission denied"
**วิธีแก้:** ตรวจสอบว่า你有権限 push ไป main branch หรือใช้ PR แทน

---

## 📚 Commands Cheat Sheet

```bash
# ดู branch ทั้งหมด
git branch -a

# ดู status
git status

# Switch branch
git checkout main
git checkout dev

# Pull latest
git pull origin main

# Merge
git merge dev

# Push
git push origin main

# ดู commit history
git log --oneline --graph --all

# ดู diff
git diff main..dev
```
