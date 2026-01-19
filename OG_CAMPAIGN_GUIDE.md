# 🎖️ คู่มือโปรโมชั่น OG Campaign (Original Gangs)

## 📋 ภาพรวม

**OG Campaign** = โปรโมชั่นพิเศษสำหรับสมาชิกผู้ก่อตั้ง (Early Bird)

### เงื่อนไขการเข้าร่วม
- **สมัครก่อน:** 25 ธันวาคม 2025
- **ระยะเวลาสิทธิพิเศษ:** 2 ปี นับจากวันที่สมัคร

---

## 🎁 สิทธิพิเศษที่ได้รับ

### 1. Token 2 เท่า (2x Token Multiplier)
- **ปกติ:** ได้ Token ตามแพ็กเกจ
- **OG:** ได้ Token **2 เท่า** เป็นเวลา 2 ปี

**ตัวอย่าง:**
- BASIC: ปกติได้ 100 tokens → OG ได้ **200 tokens**
- PRO: ปกติได้ 300 tokens → OG ได้ **600 tokens**
- PREMIUM: ปกติได้ 700 tokens → OG ได้ **1,400 tokens**

### 2. ส่วนลดการใช้ Token 30%
- **ปกติ:** ใช้ Token ตามราคาเต็ม
- **OG:** ลดค่าใช้ Token **30%** เป็นเวลา 2 ปี

**ตัวอย่าง:**
- โฆษณา 500 tokens → จ่าย **350 tokens** (ลด 30%)
- Campaign 1,000 tokens → จ่าย **700 tokens** (ลด 30%)

### 3. OG Badge ตลอดชีพ
- แสดงป้าย "OG" หรือ "Original Gangs" บนร้านค้า
- ไม่มีวันหมดอายุ (ตลอดชีพ)

---

## 🗄️ Database Schema

### User Model
```typescript
User {
  isOGMember: boolean          // เป็นสมาชิก OG หรือไม่
  ogJoinedAt: DateTime?        // วันที่สมัคร OG
  ogBenefitsUntil: DateTime?   // สิทธิพิเศษหมดเมื่อ (joinedAt + 2 ปี)
  ogBadgeEnabled: boolean       // แสดง badge หรือไม่ (default: true)
}
```

### ShopSubscription Model
```typescript
ShopSubscription {
  is_og_subscription: boolean   // สมัครในช่วง OG campaign
  og_token_multiplier: float    // 2.0 สำหรับ OG (2 ปีแรก)
  og_usage_discount: float      // 0.30 สำหรับ OG (30% off)
}
```

---

## 🔄 Flow การสมัคร OG

### เงื่อนไขการตรวจสอบ
```typescript
const OG_CAMPAIGN_END_DATE = new Date('2025-12-25');
const OG_BENEFITS_DURATION_DAYS = 730; // 2 ปี

function isOGEligible(subscriptionDate: Date): boolean {
  return subscriptionDate <= OG_CAMPAIGN_END_DATE;
}

function calculateOGBenefitsUntil(joinedAt: Date): Date {
  return new Date(joinedAt.getTime() + OG_BENEFITS_DURATION_DAYS * 24 * 60 * 60 * 1000);
}
```

### Flow การสมัคร
```
1. Shop สมัครสมาชิก
   ↓
2. ตรวจสอบวันที่สมัคร
   - ถ้า ≤ 25 ธ.ค. 2025 → เป็น OG
   ↓
3. สร้าง ShopSubscription
   - is_og_subscription = true
   - og_token_multiplier = 2.0
   - og_usage_discount = 0.30
   ↓
4. อัปเดต User
   - isOGMember = true
   - ogJoinedAt = วันนี้
   - ogBenefitsUntil = joinedAt + 2 ปี
   - ogBadgeEnabled = true
   ↓
5. ให้ Token (2 เท่า)
   - tokenAmount = plan.tokenAmount × 2
   - เพิ่มเข้า TokenWallet
```

---

## 💰 การคำนวณ Token สำหรับ OG

### เมื่อสมัครสมาชิก
```typescript
function calculateOGTokens(planTokenAmount: number, isOG: boolean): number {
  if (!isOG) return planTokenAmount;
  
  const multiplier = 2.0; // OG multiplier
  return Math.floor(planTokenAmount * multiplier);
}

// ตัวอย่าง
const basicTokens = 100;
const ogBasicTokens = calculateOGTokens(basicTokens, true); // 200 tokens
```

### เมื่อใช้ Token (ส่วนลด 30%)
```typescript
function calculateOGTokenCost(baseCost: number, subscription: ShopSubscription): number {
  if (!subscription.is_og_subscription) return baseCost;
  
  // ตรวจสอบว่ายังอยู่ในช่วงสิทธิพิเศษหรือไม่
  const now = new Date();
  const benefitsUntil = subscription.ogBenefitsUntil || new Date();
  
  if (now > benefitsUntil) {
    // หมดอายุแล้ว ใช้ราคาปกติ
    return baseCost;
  }
  
  // ยังอยู่ในช่วงสิทธิพิเศษ → ลด 30%
  const discount = subscription.og_usage_discount || 0.30;
  return Math.ceil(baseCost * (1 - discount));
}

// ตัวอย่าง
const adCost = 500; // tokens
const ogAdCost = calculateOGTokenCost(adCost, ogSubscription); // 350 tokens (ลด 30%)
```

---

## 📊 ตัวอย่างการใช้งาน

### กรณีที่ 1: สมัคร BASIC แบบ OG
```
แพ็กเกจ: BASIC (199 บาท/เดือน)
Token ปกติ: 100 tokens
Token OG: 200 tokens (2 เท่า)

เมื่อซื้อโฆษณา:
- ราคาปกติ: 500 tokens
- ราคา OG: 350 tokens (ลด 30%)
```

### กรณีที่ 2: สมัคร PREMIUM แบบ OG
```
แพ็กเกจ: PREMIUM (999 บาท/เดือน)
Token ปกติ: 700 tokens
Token OG: 1,400 tokens (2 เท่า)

เมื่อซื้อโฆษณา:
- ราคาปกติ: 1,500 tokens
- ราคา OG: 1,050 tokens (ลด 30%)
```

### กรณีที่ 3: หมดอายุสิทธิพิเศษ
```
สมัคร: 1 ม.ค. 2025
สิทธิพิเศษหมด: 1 ม.ค. 2027 (2 ปี)

หลังจาก 1 ม.ค. 2027:
- Token: ได้ตามแพ็กเกจปกติ (ไม่คูณ 2)
- ส่วนลด: ไม่มี (ใช้ราคาเต็ม)
- Badge: ยังแสดงได้ (ตลอดชีพ)
```

---

## 🔍 การตรวจสอบสถานะ OG

### ตรวจสอบว่าเป็น OG หรือไม่
```typescript
async function checkOGStatus(shopId: string) {
  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      shopId,
      status: 'ACTIVE',
      is_og_subscription: true
    }
  });
  
  if (!subscription) return { isOG: false };
  
  const now = new Date();
  const benefitsUntil = subscription.ogBenefitsUntil || new Date();
  const isActive = now <= benefitsUntil;
  
  return {
    isOG: true,
    isActive, // ยังอยู่ในช่วงสิทธิพิเศษหรือไม่
    benefitsUntil,
    tokenMultiplier: subscription.og_token_multiplier,
    usageDiscount: subscription.og_usage_discount
  };
}
```

### ตรวจสอบว่า User เป็น OG Member หรือไม่
```typescript
async function checkUserOGStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isOGMember: true,
      ogJoinedAt: true,
      ogBenefitsUntil: true,
      ogBadgeEnabled: true
    }
  });
  
  if (!user?.isOGMember) return { isOG: false };
  
  const now = new Date();
  const isActive = user.ogBenefitsUntil 
    ? now <= user.ogBenefitsUntil 
    : false;
  
  return {
    isOG: true,
    isActive,
    joinedAt: user.ogJoinedAt,
    benefitsUntil: user.ogBenefitsUntil,
    badgeEnabled: user.ogBadgeEnabled
  };
}
```

---

## ⚠️ หมายเหตุสำคัญ

### 1. วันที่สิ้นสุดโปรโมชั่น
- **25 ธันวาคม 2025** - วันที่สุดท้ายที่สมัครได้
- หลังจากนี้จะไม่สามารถเป็น OG ได้

### 2. ระยะเวลาสิทธิพิเศษ
- **2 ปี** นับจากวันที่สมัคร
- Token 2 เท่า: ใช้ได้ 2 ปี
- ส่วนลด 30%: ใช้ได้ 2 ปี
- Badge: ตลอดชีพ (ไม่หมดอายุ)

### 3. การต่ออายุสมาชิก
- ถ้าต่ออายุภายใน 2 ปี → ยังได้สิทธิพิเศษ OG
- ถ้าต่ออายุหลังจาก 2 ปี → ได้ Token ตามแพ็กเกจปกติ (ไม่คูณ 2)

### 4. การใช้ Token
- ส่วนลด 30% ใช้กับ:
  - ✅ การซื้อโฆษณา (Ad Purchase)
  - ✅ การจ่าย Creator (Campaign Payment)
- ไม่ใช้กับ:
  - ❌ การซื้อ Token โดยตรง (ซื้อตามราคาปกติ)

---

## 🛠️ Implementation Notes

### API Routes ที่ต้องอัปเดต

1. **POST /api/shops/[shopId]/subscription**
   - ตรวจสอบวันที่สมัคร
   - ตั้งค่า `is_og_subscription`, `og_token_multiplier`, `og_usage_discount`
   - คำนวณ Token 2 เท่า

2. **POST /api/ads/purchase**
   - ตรวจสอบ `og_usage_discount`
   - คำนวณราคาหลังส่วนลด 30%

3. **POST /api/campaign-jobs/[id]/complete**
   - ตรวจสอบ `og_usage_discount`
   - คำนวณราคาหลังส่วนลด 30%

4. **GET /api/shops/[shopId]**
   - แสดง OG Badge ถ้า `ogBadgeEnabled = true`

---

## 📝 สรุป

### สิทธิพิเศษ OG
- ✅ Token 2 เท่า (2 ปี)
- ✅ ส่วนลดการใช้ Token 30% (2 ปี)
- ✅ OG Badge ตลอดชีพ

### เงื่อนไข
- ⏰ สมัครก่อน 25 ธ.ค. 2025
- ⏰ สิทธิพิเศษ 2 ปี

### Database Fields
- `User.isOGMember`, `ogJoinedAt`, `ogBenefitsUntil`, `ogBadgeEnabled`
- `ShopSubscription.is_og_subscription`, `og_token_multiplier`, `og_usage_discount`

---

**Last Updated:** 2025-01-XX  
**Campaign End Date:** 25 ธันวาคม 2025  
**Benefits Duration:** 2 ปี
