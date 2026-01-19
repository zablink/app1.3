# 🎖️ คู่มือการตั้งค่า OG Campaign

## 📋 ภาพรวม

OG Campaign ใช้ **SiteSetting** เพื่อเก็บวันที่เริ่มและสิ้นสุด campaign ทำให้สามารถปรับเปลี่ยนได้โดยไม่ต้องแก้โค้ด

---

## ⚙️ การตั้งค่า SiteSetting

### 1. เปิด/ปิด OG Campaign

**Key:** `og_campaign_enabled`  
**Type:** `boolean`  
**Default:** `true`

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_campaign_enabled',
  'true',
  'boolean',
  'campaign',
  'OG Campaign Enabled',
  'เปิด/ปิด OG Campaign'
)
ON CONFLICT (key) DO UPDATE SET value = 'true';
```

### 2. วันที่เริ่ม Campaign

**Key:** `og_campaign_start_date`  
**Type:** `string` (ISO date format)  
**Example:** `2025-01-01T00:00:00.000Z`

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_campaign_start_date',
  '2025-01-01T00:00:00.000Z',
  'string',
  'campaign',
  'OG Campaign Start Date',
  'วันที่เริ่ม OG Campaign (ISO format)'
)
ON CONFLICT (key) DO UPDATE SET value = '2025-01-01T00:00:00.000Z';
```

### 3. วันที่สิ้นสุด Campaign

**Key:** `og_campaign_end_date`  
**Type:** `string` (ISO date format)  
**Example:** `2025-12-31T23:59:59.999Z`

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_campaign_end_date',
  '2025-12-31T23:59:59.999Z',
  'string',
  'campaign',
  'OG Campaign End Date',
  'วันที่สิ้นสุด OG Campaign (ISO format)'
)
ON CONFLICT (key) DO UPDATE SET value = '2025-12-31T23:59:59.999Z';
```

### 4. ระยะเวลาสิทธิพิเศษ (วัน)

**Key:** `og_benefits_duration_days`  
**Type:** `number`  
**Default:** `730` (2 ปี)

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_benefits_duration_days',
  '730',
  'number',
  'campaign',
  'OG Benefits Duration (Days)',
  'ระยะเวลาสิทธิพิเศษ OG (วัน) - default 730 วัน (2 ปี)'
)
ON CONFLICT (key) DO UPDATE SET value = '730';
```

### 5. Token Multiplier

**Key:** `og_token_multiplier`  
**Type:** `number`  
**Default:** `2.0` (2 เท่า)

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_token_multiplier',
  '2.0',
  'number',
  'campaign',
  'OG Token Multiplier',
  'ตัวคูณ Token สำหรับ OG (default: 2.0 = 2 เท่า)'
)
ON CONFLICT (key) DO UPDATE SET value = '2.0';
```

### 6. ส่วนลดการใช้ Token

**Key:** `og_usage_discount`  
**Type:** `number` (0-1)  
**Default:** `0.30` (30%)

```sql
INSERT INTO site_settings (key, value, data_type, category, label, description)
VALUES (
  'og_usage_discount',
  '0.30',
  'number',
  'campaign',
  'OG Usage Discount',
  'ส่วนลดการใช้ Token สำหรับ OG (0-1, default: 0.30 = 30%)'
)
ON CONFLICT (key) DO UPDATE SET value = '0.30';
```

---

## 📝 Script สำหรับตั้งค่าเริ่มต้น

สร้างไฟล์ `scripts/setup-og-campaign.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupOGCampaign() {
  console.log('🎖️ Setting up OG Campaign settings...');

  const settings = [
    {
      key: 'og_campaign_enabled',
      value: 'true',
      dataType: 'boolean',
      category: 'campaign',
      label: 'OG Campaign Enabled',
      description: 'เปิด/ปิด OG Campaign',
    },
    {
      key: 'og_campaign_start_date',
      value: new Date('2025-01-01').toISOString(),
      dataType: 'string',
      category: 'campaign',
      label: 'OG Campaign Start Date',
      description: 'วันที่เริ่ม OG Campaign (ISO format)',
    },
    {
      key: 'og_campaign_end_date',
      value: new Date('2025-12-31T23:59:59.999Z').toISOString(),
      dataType: 'string',
      category: 'campaign',
      label: 'OG Campaign End Date',
      description: 'วันที่สิ้นสุด OG Campaign (ISO format)',
    },
    {
      key: 'og_benefits_duration_days',
      value: '730',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Benefits Duration (Days)',
      description: 'ระยะเวลาสิทธิพิเศษ OG (วัน) - default 730 วัน (2 ปี)',
    },
    {
      key: 'og_token_multiplier',
      value: '2.0',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Token Multiplier',
      description: 'ตัวคูณ Token สำหรับ OG (default: 2.0 = 2 เท่า)',
    },
    {
      key: 'og_usage_discount',
      value: '0.30',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Usage Discount',
      description: 'ส่วนลดการใช้ Token สำหรับ OG (0-1, default: 0.30 = 30%)',
    },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        dataType: setting.dataType,
        category: setting.category,
        label: setting.label,
        description: setting.description,
      },
      create: setting,
    });
    console.log(`✅ ${setting.key}: ${setting.value}`);
  }

  console.log('\n✨ OG Campaign settings configured!');
}

setupOGCampaign()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🔧 การอัปเดตผ่าน Admin Panel

สามารถอัปเดตผ่าน Admin Settings page (`/admin/settings`) โดย:

1. ไปที่หน้า Settings
2. ค้นหา category: `campaign`
3. แก้ไขค่าตามต้องการ:
   - `og_campaign_start_date` - วันที่เริ่ม
   - `og_campaign_end_date` - วันที่สิ้นสุด
   - `og_benefits_duration_days` - ระยะเวลาสิทธิพิเศษ
   - `og_token_multiplier` - ตัวคูณ Token
   - `og_usage_discount` - ส่วนลด

---

## 📊 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: ตั้ง Campaign ใหม่

```typescript
// ตั้ง Campaign เริ่ม 1 ม.ค. 2026, สิ้นสุด 31 มี.ค. 2026
await prisma.siteSetting.update({
  where: { key: 'og_campaign_start_date' },
  data: { value: new Date('2026-01-01').toISOString() },
});

await prisma.siteSetting.update({
  where: { key: 'og_campaign_end_date' },
  data: { value: new Date('2026-03-31T23:59:59.999Z').toISOString() },
});
```

### ตัวอย่างที่ 2: ปิด Campaign ชั่วคราว

```typescript
await prisma.siteSetting.update({
  where: { key: 'og_campaign_enabled' },
  data: { value: 'false' },
});
```

### ตัวอย่างที่ 3: เปลี่ยน Token Multiplier เป็น 1.5 เท่า

```typescript
await prisma.siteSetting.update({
  where: { key: 'og_token_multiplier' },
  data: { value: '1.5' },
});
```

---

## ⚠️ หมายเหตุสำคัญ

1. **วันที่ต้องเป็น ISO format** - ใช้ `toISOString()` เมื่อบันทึก
2. **Cache** - Settings มี cache 5 นาที ต้องรอหรือ clear cache หลังอัปเดต
3. **Validation** - ระบบจะตรวจสอบว่า subscription date อยู่ในช่วง campaign หรือไม่
4. **Benefits Duration** - คำนวณจาก `start_date + benefits_duration_days`

---

## 🔍 การตรวจสอบสถานะ

### ตรวจสอบว่า Campaign เปิดอยู่หรือไม่

```typescript
import { isOGCampaignEnabled, isOGEligible } from '@/lib/og-campaign';

const enabled = await isOGCampaignEnabled();
const eligible = await isOGEligible(new Date());
```

### ตรวจสอบ Shop OG Status

```typescript
import { getShopOGStatus } from '@/lib/og-campaign';

const status = await getShopOGStatus(shopId);
console.log(status);
// {
//   isOG: true,
//   isActive: true,
//   benefitsUntil: Date,
//   tokenMultiplier: 2.0,
//   usageDiscount: 0.30
// }
```

---

**Last Updated:** 2025-01-XX
