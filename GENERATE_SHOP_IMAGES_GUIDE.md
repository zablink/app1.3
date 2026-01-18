# 🎨 คู่มือสร้างรูปภาพอาหารสำหรับร้านค้า

## 📋 ภาพรวม

Script นี้จะ:
1. Query ข้อมูลร้านค้าจาก database (ตามที่ `src/app/page.tsx` ใช้)
2. สร้างรูปภาพอาหารตามชื่อร้าน
3. Save ไฟล์ด้วยชื่อที่ได้จาก database
4. อัพเดท database ด้วย path ของรูปภาพ

---

## 🚀 วิธีใช้งาน

### 1. ตั้งค่า Environment Variables

เพิ่ม API key ใน `.env` file (เลือกอย่างใดอย่างหนึ่ง):

#### Option A: ใช้ OpenAI DALL-E (แนะนำ - คุณภาพดี)
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Option B: ใช้ Grok (xAI) - เร็วและคุณภาพดี
```env
GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# หรือ
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Option C: ใช้ Stable Diffusion (Hugging Face)
```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Option D: ไม่ใช้ API (ใช้ Placeholder)
ถ้าไม่ใส่ API key จะใช้ placeholder SVG images

---

### 2. รัน Script

```bash
npm run generate:shop-images
```

หรือใช้ tsx โดยตรง:
```bash
npx tsx scripts/generate-shop-images-commonjs.ts
```

---

## 📁 Output

รูปภาพจะถูก save ที่:
```
public/images/shops/
```

ชื่อไฟล์ format:
```
[ชื่อร้าน-sanitized]-[shop-id-8-chars].png
```

ตัวอย่าง:
```
ร้านอาหารไทยอร่อย-cm123456.png
```

---

## ⚙️ Features

### 1. Auto-skip ร้านที่มีรูปแล้ว
- ตรวจสอบว่า database มี `image` field แล้วหรือยัง
- ตรวจสอบว่าไฟล์มีอยู่แล้วหรือยัง
- Skip ร้านที่สร้างรูปแล้ว

### 2. Auto-update Database
- หลังจากสร้างรูปสำเร็จ จะอัพเดท `Shop.image` field ใน database
- Path format: `/images/shops/[filename].png`

### 3. Rate Limiting
- DALL-E: รอ 2 วินาที ระหว่าง requests
- Stable Diffusion: รอ 1 วินาที ระหว่าง requests
- Placeholder: ไม่มี delay

### 4. Error Handling
- จัดการ API errors
- จัดการ file system errors
- จัดการ database errors
- แสดง summary เมื่อเสร็จ

---

## 📊 Output Example

```
🚀 Starting shop image generation...

📋 Configuration:
   - OpenAI DALL-E: ✅ Available
   - Stable Diffusion: ❌ Not configured
   - Placeholder: 
   - Output directory: /path/to/public/images/shops

📊 Querying shops from database...
✅ Found 10 shops

[1/10] Processing: ร้านอาหารไทยอร่อย
   📝 Prompt: A beautiful, appetizing photo of ร้านอาหารไทยอร่อย...
   🎨 Generating with DALL-E...
   ✅ Saved: ร้านอาหารไทยอร่อย-cm123456.png
   💾 Updated database with image path: /images/shops/ร้านอาหารไทยอร่อย-cm123456.png
   ⏳ Waiting 2000ms before next request...

...

==================================================
📊 Summary:
   ✅ Success: 8
   ⏭️  Skipped: 2
   ❌ Errors: 0
   📁 Output directory: /path/to/public/images/shops
==================================================

✅ Script completed successfully
```

---

## 🔧 Configuration

### Query Shops
Script จะ query shops ที่:
- `status = 'APPROVED'` หรือ `status IS NULL`
- เรียงตาม `createdAt DESC`

### Image Generation

#### DALL-E Prompt Format:
```
A beautiful, appetizing photo of [shop name] - [description]. 
อาหารไทย, Thai food, delicious, appetizing, professional food photography, 
restaurant quality, high quality, food styling, gourmet.
```

#### Stable Diffusion Prompt:
```
[shop name] - [description]. อาหารไทย, Thai food, delicious, appetizing, 
professional food photography, restaurant quality, high quality, food styling, gourmet.
```

#### Placeholder:
- SVG image with gradient background
- Shop name as text
- 🍽️ อาหารไทย emoji

---

## 💰 Cost Estimation

### OpenAI DALL-E 3
- **Standard quality**: $0.040 per image
- **HD quality**: $0.080 per image
- ตัวอย่าง: 100 ร้าน = $4.00 - $8.00

### Grok (xAI) grok-2-image
- **Cost**: ~$0.07 per image
- **Rate limit**: 5 requests/second
- ตัวอย่าง: 100 ร้าน = $7.00
- **Note**: รูปภาพจะเป็น JPEG format, ไม่รองรับ size/quality customization

### Stable Diffusion (Hugging Face)
- **Free tier**: Limited requests
- **Paid**: Varies by provider

### Placeholder
- **Free**: No cost

---

## 🐛 Troubleshooting

### Problem: "Can't reach database server"
**Solution:** ตรวจสอบ `DATABASE_URL` ใน `.env`

### Problem: "API key invalid"
**Solution:** ตรวจสอบ API key ใน `.env` ว่าถูกต้อง

### Problem: "Rate limit exceeded"
**Solution:** 
- เพิ่ม delay ระหว่าง requests
- หรือรอสักครู่แล้วรันใหม่

### Problem: "Failed to save image"
**Solution:**
- ตรวจสอบว่า `public/images/shops/` directory มีอยู่
- ตรวจสอบ file permissions

---

## 📝 Notes

1. **Database Update**: Script จะอัพเดท `Shop.image` field อัตโนมัติ
2. **File Naming**: ชื่อไฟล์จะ sanitize อักขระพิเศษออก
3. **Skip Logic**: ร้านที่มีรูปแล้วจะถูก skip
4. **Error Recovery**: ถ้า error ในการสร้างรูป จะข้ามไปร้านถัดไป

---

## 🔗 Related Files

- `src/app/page.tsx` - Frontend page ที่ใช้ข้อมูลร้าน
- `src/app/api/shops/route.ts` - API route ที่ query shops
- `prisma/schema.prisma` - Database schema

---

## 💡 Tips

1. **Test with 1-2 shops ก่อน**: รัน script ด้วย shops น้อยๆ ก่อนเพื่อทดสอบ
2. **Monitor API costs**: ตรวจสอบ API usage ใน dashboard
3. **Backup database**: Backup database ก่อนรัน script
4. **Batch processing**: ถ้ามีร้านเยอะ แบ่งรันเป็น batch

---

## 🎯 Next Steps

หลังจากสร้างรูปแล้ว:
1. ตรวจสอบรูปภาพใน `public/images/shops/`
2. ตรวจสอบ database ว่า `Shop.image` field ถูกอัพเดทแล้ว
3. ทดสอบหน้าเว็บว่าแสดงรูปภาพได้ถูกต้อง
