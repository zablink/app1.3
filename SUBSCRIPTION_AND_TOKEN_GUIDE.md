# คู่มือระบบ Subscription Plan และ Token สำหรับร้านค้า

## 📋 สารบัญ
1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Subscription Plans (แพ็กเกจสมาชิก)](#subscription-plans-แพ็กเกจสมาชิก)
3. [Token System (ระบบ Token)](#token-system-ระบบ-token)
4. [การใช้งาน Token](#การใช้งาน-token)
5. [Flow Diagram](#flow-diagram)

---

## 🎯 ภาพรวมระบบ

ระบบมี 2 ส่วนหลักที่ทำงานร่วมกัน:

1. **Subscription Plans** - แพ็กเกจสมาชิกรายเดือนที่ให้สิทธิ์และ features ต่างๆ
2. **Token System** - ระบบเหรียญที่ใช้จ่ายสำหรับ:
   - โฆษณา (Location-based ads)
   - จ่าย Creator สำหรับรีวิว (Campaign jobs)

---

## 📦 Subscription Plans (แพ็กเกจสมาชิก)

### โครงสร้างข้อมูล

```typescript
SubscriptionPackage {
  id: string
  name: string                    // "FREE", "BASIC", "PRO", "PREMIUM"
  price: number                   // ราคา (บาท)
  price_monthly: Decimal          // ราคารายเดือน
  period_days: number             // ระยะเวลา (วัน) - default 30
  tier: SubscriptionTier          // FREE | BASIC | PRO | PREMIUM
  
  // Features & Limits
  max_images: number?              // จำนวนรูปภาพสูงสุด
  max_menu_items: number?         // จำนวนเมนูสูงสุด
  max_delivery_links: number?      // จำนวนลิงก์ส่งอาหารสูงสุด
  max_promotions: number?          // จำนวนโปรโมชันสูงสุด
  
  // Advanced Features
  has_advanced_analytics: boolean // สถิติแบบละเอียด
  can_pin_on_map: boolean         // ปักหมุดบนแผนที่
  can_reply_reviews: boolean     // ตอบรีวิวได้
  can_set_special_hours: boolean  // ตั้งเวลาพิเศษ
  can_create_coupons: boolean     // สร้างคูปองได้
  has_verified_badge: boolean    // ป้าย Verified
  has_social_integration: boolean // เชื่อมต่อโซเชียล
  
  // Token Benefits
  token_amount: number?           // จำนวน Token ที่ได้รับเมื่อสมัคร
  monthly_commission_tokens: number? // Token ที่ได้รับรายเดือน
  
  // Discounts
  banner_ad_discount_percent: Decimal // ส่วนลดโฆษณา (%)
  
  // Support
  support_level: string           // "EMAIL" | "PHONE" | "DEDICATED"
}
```

### แพ็กเกจที่มีอยู่

#### 1. FREE (ฟรี)
- **ราคา:** 0 บาท
- **ระยะเวลา:** ตลอดไป
- **Features:**
  - ลงข้อมูลร้านค้าพื้นฐาน
  - อัพโหลดรูปภาพได้ 3 รูป
  - แสดงในผลการค้นหา
  - รับรีวิวจากลูกค้า
- **Token:** 0 tokens
- **ข้อจำกัด:**
  - ไม่มีตำแหน่งพิเศษ
  - ไม่สามารถโปรโมทได้

#### 2. BASIC (เบสิก)
- **ราคา:** 199 บาท/เดือน
- **ระยะเวลา:** 30 วัน
- **Features:**
  - ทุกอย่างใน FREE
  - อัพโหลดรูปภาพได้ 10 รูป
  - ป้าย "Verified" บนร้าน
  - ลิงก์แพลตฟอร์มส่งอาหาร
  - สถิติการเข้าชมร้าน
- **Token:** 100 tokens ฟรีเมื่อสมัคร
- **Token รายเดือน:** 10 tokens

#### 3. PRO (โปร)
- **ราคา:** 499 บาท/เดือน
- **ระยะเวลา:** 30 วัน
- **Features:**
  - ทุกอย่างใน BASIC
  - อัพโหลดรูปภาพได้ 30 รูป
  - ป้าย "Pro Shop" โดดเด่น
  - แสดงในหน้าแรก (แบบสุ่ม)
  - สถิติแบบละเอียด
- **Token:** 300 tokens ฟรีเมื่อสมัคร
- **Token รายเดือน:** 25 tokens
- **ส่วนลดโฆษณา:** 10%

#### 4. PREMIUM (พรีเมียม)
- **ราคา:** 999 บาท/เดือน
- **ระยะเวลา:** 30 วัน
- **Features:**
  - ทุกอย่างใน PRO
  - อัพโหลดรูปภาพไม่จำกัด
  - ป้าย "Premium Partner" พิเศษ
  - ติดหน้าแรกเป็นพิเศษ
  - การวิเคราะห์ขั้นสูง
- **Token:** 700 tokens ฟรีเมื่อสมัคร
- **Token รายเดือน:** 60 tokens
- **ส่วนลดโฆษณา:** 20%
- **Support:** Account Manager เฉพาะ

### ShopSubscription (การสมัครสมาชิก)

```typescript
ShopSubscription {
  id: string
  shop_id: string
  package_id: string
  start_date: Date
  end_date: Date
  status: SubscriptionStatus    // ACTIVE | EXPIRED | CANCELLED | SUSPENDED
  auto_renew: boolean          // ต่ออายุอัตโนมัติ
  payment_status: string      // PENDING | PAID | FAILED
  original_price: Decimal
  discount_amount: Decimal
  final_price: Decimal
  renewal_count: number        // จำนวนครั้งที่ต่ออายุ
}
```

### Flow การสมัครสมาชิก

```
1. Shop เลือกแพ็กเกจ
   ↓
2. POST /api/shops/[shopId]/subscription
   - สร้าง ShopSubscription (status: ACTIVE)
   - ตั้ง start_date และ end_date
   ↓
3. ถ้าแพ็กเกจมี token_amount > 0:
   - สร้าง/อัปเดต TokenWallet
   - เพิ่ม balance ด้วย token_amount
   - สร้าง TokenPurchase record (batch)
   ↓
4. ชำระเงิน (Omise)
   ↓
5. Webhook อัปเดต payment_status เป็น PAID
```

---

## 🪙 Token System (ระบบ Token)

### โครงสร้างข้อมูล

#### 1. TokenWallet (กระเป๋า Token)
```typescript
TokenWallet {
  id: string
  shop_id: string (unique)  // 1 shop = 1 wallet
  balance: number          // ยอด Token ที่ใช้ได้
  created_at: DateTime
  updated_at: DateTime
}
```

#### 2. TokenPurchase (การซื้อ Token - Batch)
```typescript
TokenPurchase {
  id: string
  wallet_id: string
  amount: number           // จำนวน Token ที่ซื้อ
  remaining: number        // จำนวน Token ที่เหลือ (ใช้ FIFO)
  price: number           // ราคาที่ซื้อ (บาท)
  provider: string        // "omise" | "subscription"
  providerRef: string?     // Reference จาก payment provider
  createdAt: DateTime
  expiresAt: DateTime     // หมดอายุ (default: 90 วัน)
}
```

**สำคัญ:** Token ถูกจัดการแบบ **Batch-based** และใช้ **FIFO (First In First Out)** - ใช้ Token ที่ซื้อก่อนก่อน

#### 3. TokenUsage (บันทึกการใช้งาน Token)
```typescript
TokenUsage {
  id: string
  wallet_id: string
  type: string            // "ad_purchase" | "campaign_payment"
  amount: number          // จำนวน Token ที่ใช้
  referenceId: string?     // ID ของ AdPurchase หรือ CampaignJob
  createdAt: DateTime
}
```

### วิธีได้ Token

#### 1. จาก Subscription Plan
- เมื่อสมัครแพ็กเกจ → ได้ `token_amount` tokens
- รายเดือน (ถ้ามี) → ได้ `monthly_commission_tokens` tokens

#### 2. ซื้อ Token โดยตรง
```
POST /api/shops/[shopId]/tokens
Body: {
  amountTokens: 1000,
  price: 900  // บาท
}
```

**Flow:**
1. สร้าง TokenPurchase (batch)
2. สร้าง Omise charge
3. เมื่อชำระเงินสำเร็จ (webhook) → อัปเดต TokenWallet.balance

### Token Expiration (การหมดอายุ)

- **Default:** Token หมดอายุใน **90 วัน** หลังจากซื้อ
- **Cron Job:** ตรวจสอบและลบ Token ที่หมดอายุทุกวัน
- เมื่อ Token หมดอายุ → ลบ `remaining` ออกจาก `balance`

---

## 💰 การใช้งาน Token

### 1. ซื้อโฆษณา (Ad Purchase)

**API:** `POST /api/ads/purchase`

**Request:**
```json
{
  "shopId": "shop_123",
  "scope": "PROVINCE",           // SUBDISTRICT | DISTRICT | PROVINCE | NATIONWIDE
  "durationDays": 7,
  "tokenCost": 3500              // ราคา Token (50 tokens/วัน × 7 วัน)
}
```

**ราคาโฆษณา (ต่อวัน):**
- ตำบล (SUBDISTRICT): 50 tokens/วัน
- อำเภอ (DISTRICT): 200 tokens/วัน
- จังหวัด (PROVINCE): 500 tokens/วัน
- ภูมิภาค (REGION): 1,500 tokens/วัน
- ประเทศ (NATIONWIDE): 3,000 tokens/วัน

**Algorithm การหัก Token (พร้อมส่วนลด):**

```
1. คำนวณ rawRequired = tokenCost
   ↓
2. เลือก TokenPurchase batches (FIFO - เก่าที่สุดก่อน)
   ที่มี remaining > 0 และยังไม่หมดอายุ
   ↓
3. คำนวณส่วนลดจากแต่ละ batch:
   - 30 วันแรก: 10% ส่วนลด
   - 31-60 วัน: 7% ส่วนลด
   - 61+ วัน (ยกเว้น 14 วันสุดท้าย): 5% ส่วนลด
   - 14 วันสุดท้าย: ไม่มีส่วนลด
   ↓
4. หา maxDiscount จาก batches ที่เลือก
   ↓
5. คำนวณ effectiveRequired = ceil(tokenCost × (1 - maxDiscount))
   ↓
6. หัก effectiveRequired tokens จาก batches (FIFO)
   - อัปเดต TokenPurchase.remaining
   - อัปเดต TokenWallet.balance
   ↓
7. สร้าง TokenUsage records
8. สร้าง AdPurchase record
```

**ตัวอย่าง:**
- ซื้อโฆษณา 7 วัน = 350 tokens
- มี TokenPurchase batch เก่า 60 วัน (ส่วนลด 5%)
- effectiveRequired = 350 × 0.95 = 332.5 → 333 tokens
- หัก 333 tokens จาก wallet

### 2. จ่าย Creator สำหรับ Campaign Job

**Flow:**
```
1. Shop สร้าง Campaign
   - กำหนด totalBudget (tokens)
   ↓
2. Creator รับงาน (accept job)
   - กำหนด agreedPrice (tokens)
   ↓
3. Creator ส่งผลงาน (submit)
   ↓
4. Shop อนุมัติงาน (complete)
   POST /api/campaign-jobs/[id]/complete
   ↓
5. ระบบคำนวณ:
   - tokensPaid = agreedPrice
   - platformCommission = agreedPrice × 10%
   - creatorEarning = agreedPrice - platformCommission
   ↓
6. หัก Token จาก Campaign.remainingBudget
   (ไม่หักจาก TokenWallet - ใช้ budget ที่จองไว้แล้ว)
   ↓
7. สร้าง Earning record สำหรับ Creator
```

**หมายเหตุ:** 
- Token สำหรับ Campaign ถูกจองไว้ใน `Campaign.totalBudget` และ `Campaign.remainingBudget`
- ไม่หักจาก TokenWallet โดยตรง (จองไว้แล้วตอนสร้าง Campaign)
- Creator ได้รับเงินเป็นบาท (ไม่ใช่ Token)

### 3. Token Discount System

**ส่วนลดตามอายุ Token:**
- **0-30 วัน:** 10% ส่วนลด
- **31-60 วัน:** 7% ส่วนลด  
- **61+ วัน (ยกเว้น 14 วันสุดท้าย):** 5% ส่วนลด
- **14 วันสุดท้าย:** ไม่มีส่วนลด

**Logic:** ใช้ส่วนลดสูงสุดจาก batch ที่ใช้

---

## 🔄 Flow Diagram

### Flow การสมัครสมาชิกและรับ Token

```
┌─────────────┐
│ Shop เลือก   │
│ แพ็กเกจ      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ POST /subscription  │
│ - สร้าง Subscription │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ มี token_amount?    │
│ YES                 │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ สร้าง/อัปเดต Wallet │
│ balance += tokens   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ สร้าง TokenPurchase │
│ (batch)             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ชำระเงิน (Omise)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Webhook อัปเดต      │
│ payment_status      │
└─────────────────────┘
```

### Flow การซื้อโฆษณาด้วย Token

```
┌─────────────┐
│ Shop เลือก   │
│ โฆษณา        │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ POST /ads/purchase  │
│ tokenCost = 3500    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ เลือก TokenPurchase │
│ batches (FIFO)     │
│ ที่ยังไม่หมดอายุ     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ คำนวณส่วนลด         │
│ maxDiscount = 5%    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ effectiveRequired = │
│ 3500 × 0.95 = 3325 │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ หัก Token (FIFO)    │
│ - อัปเดต remaining  │
│ - อัปเดต balance    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ สร้าง TokenUsage    │
│ สร้าง AdPurchase    │
└─────────────────────┘
```

### Flow การจ่าย Creator

```
┌─────────────┐
│ Shop สร้าง   │
│ Campaign    │
│ budget=1000 │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Creator รับงาน      │
│ agreedPrice=500     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Creator ส่งผลงาน    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Shop อนุมัติ        │
│ POST /complete      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ คำนวณ:              │
│ - tokensPaid: 500   │
│ - commission: 50    │
│ - earning: 450      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ หักจาก              │
│ Campaign.budget     │
│ (ไม่หักจาก Wallet)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ สร้าง Earning       │
│ สำหรับ Creator      │
└─────────────────────┘
```

---

## 📊 สรุป

### Subscription Plan
- ✅ ให้สิทธิ์และ features ตามแพ็กเกจ
- ✅ ได้ Token ฟรีเมื่อสมัคร
- ✅ ได้ Token รายเดือน (บางแพ็กเกจ)
- ✅ ส่วนลดโฆษณา (บางแพ็กเกจ)

### Token System
- ✅ ใช้สำหรับซื้อโฆษณา
- ✅ ใช้สำหรับจ่าย Creator (ผ่าน Campaign budget)
- ✅ มีระบบส่วนลดตามอายุ Token
- ✅ ใช้ FIFO (เก่าก่อน)
- ✅ หมดอายุใน 90 วัน

### API Endpoints หลัก

1. **Subscription:**
   - `GET /api/subscription-plans` - ดึงแพ็กเกจทั้งหมด
   - `POST /api/shops/[shopId]/subscription` - สมัครสมาชิก
   - `GET /api/shops/[shopId]/subscription` - ดูสมาชิกปัจจุบัน

2. **Token:**
   - `POST /api/shops/[shopId]/tokens` - ซื้อ Token
   - `GET /api/shops/[shopId]/tokens` - ดูยอด Token

3. **Ads:**
   - `POST /api/ads/purchase` - ซื้อโฆษณาด้วย Token

4. **Campaign:**
   - `POST /api/campaigns/[id]/jobs` - สร้าง Campaign job
   - `POST /api/campaign-jobs/[id]/complete` - อนุมัติและจ่าย Creator

---

**Last Updated:** 2025-01-XX
**Version:** 1.3.2
