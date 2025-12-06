# Analytics & Statistics System Guide

## ภาพรวม

ระบบ Analytics ครอบคลุมทั้ง **Google Analytics** และ **Custom Statistics** ที่เก็บข้อมูลเองในฐานข้อมูล เพื่อการวิเคราะห์และ reporting ที่ละเอียดขึ้น

---

## 🎯 คุณสมบัติหลัก

### 1. Google Analytics Integration
- ✅ ติดตั้งและพร้อมใช้งานแล้ว
- ดึง GA ID และ GTM ID จาก database (site_settings)
- แสดง script tags แบบ dynamic
- รองรับทั้ง GA4 และ Google Tag Manager

### 2. Custom Analytics System
ระบบเก็บ statistics เองในฐานข้อมูล ประกอบด้วย:

**6 ตารางหลัก:**
- `page_views` - การเข้าชมหน้าเว็บทุกหน้า
- `shop_views` - การดูร้านค้าโดยเฉพาะ (มี duration และ source)
- `user_sessions` - session ของผู้ใช้
- `events` - custom events (โทร, ขอเส้นทาง, แชร์, bookmark)
- `conversion_funnel` - ติดตาม conversion path
- `daily_stats` - สถิติรายวันที่รวมแล้ว

---

## 📊 Database Schema

### page_views
เก็บการเข้าชมหน้าเว็บทุกหน้า

```sql
CREATE TABLE page_views (
  id              TEXT PRIMARY KEY,
  page_path       TEXT NOT NULL,      -- เช่น /shop/abc123
  page_title      TEXT,
  referrer        TEXT,
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  tambon_id       INTEGER,
  amphure_id      INTEGER,
  province_id     INTEGER,
  user_agent      TEXT,
  device_type     TEXT,               -- desktop | mobile | tablet
  browser         TEXT,
  os              TEXT,
  ip_address      TEXT,
  duration        INTEGER,            -- วินาทีที่อยู่ในหน้า
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `session_id`, `user_id`, `page_path`, `created_at`, `location`

### shop_views
เก็บการดูร้านค้าโดยเฉพาะ

```sql
CREATE TABLE shop_views (
  id              TEXT PRIMARY KEY,
  shop_id         TEXT NOT NULL REFERENCES "Shop"(id),
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  view_duration   INTEGER,            -- วินาทีที่ดูร้าน
  source_type     TEXT,               -- search | category | featured | bookmark | direct
  source_id       TEXT,               -- category_id หรือ search query
  device_type     TEXT,
  tambon_id       INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `shop_id+created_at`, `session_id`, `user_id`, `source_type`, `location`

### user_sessions
session metadata ของผู้ใช้

```sql
CREATE TABLE user_sessions (
  id              TEXT PRIMARY KEY,
  session_id      TEXT UNIQUE NOT NULL,
  user_id         TEXT,
  started_at      TIMESTAMP DEFAULT NOW(),
  ended_at        TIMESTAMP,
  last_activity   TIMESTAMP DEFAULT NOW(),
  page_count      INTEGER DEFAULT 0,
  device_type     TEXT,
  browser         TEXT,
  os              TEXT,
  ip_address      TEXT,
  province_id     INTEGER,
  utm_source      TEXT,               -- จาก URL parameter
  utm_medium      TEXT,
  utm_campaign    TEXT
);
```

### events
custom events เช่น การโทร, ขอเส้นทาง, แชร์

```sql
CREATE TABLE events (
  id              TEXT PRIMARY KEY,
  event_name      TEXT NOT NULL,      -- shop_call | shop_direction | shop_share | bookmark_add | search
  event_data      JSONB,              -- เก็บข้อมูลเพิ่มเติม
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  shop_id         TEXT REFERENCES "Shop"(id),
  province_id     INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**ตัวอย่าง event_data:**
```json
{
  "shop_call": { "phone": "0812345678", "button_location": "shop_detail" },
  "search": { "query": "ส้มตำ", "results_count": 15 },
  "bookmark_add": { "notes": "อยากลองเมนูปลาเผา" }
}
```

### conversion_funnel
ติดตาม user journey

```sql
CREATE TABLE conversion_funnel (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  user_id         TEXT,
  step_name       TEXT NOT NULL,      -- homepage_view | category_view | shop_view | shop_call | ...
  step_order      INTEGER NOT NULL,   -- ลำดับของ step
  shop_id         TEXT REFERENCES "Shop"(id),
  category_id     TEXT,
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

**ตัวอย่าง funnel:**
1. `homepage_view`
2. `category_view` → categoryId: "abc"
3. `shop_view` → shopId: "xyz"
4. `shop_call` → shopId: "xyz"

### daily_stats
สถิติรายวันที่รวมแล้ว (สำหรับ dashboard)

```sql
CREATE TABLE daily_stats (
  id                      TEXT PRIMARY KEY,
  stat_date               DATE UNIQUE NOT NULL,
  total_page_views        INTEGER DEFAULT 0,
  unique_visitors         INTEGER DEFAULT 0,
  total_sessions          INTEGER DEFAULT 0,
  total_shop_views        INTEGER DEFAULT 0,
  avg_session_duration    FLOAT,
  bounce_rate             FLOAT,
  top_pages               JSONB,      -- [{path, views}, ...]
  top_shops               JSONB,      -- [{shopId, views}, ...]
  device_breakdown        JSONB,      -- {mobile: X, desktop: Y}
  location_breakdown      JSONB,      -- {provinceId: {name, views}}
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### 1. Track Page View
```typescript
POST /api/analytics/page-view
{
  "sessionId": "session_123",
  "userId": "user_abc",           // optional
  "pagePath": "/shop/abc123",
  "pageTitle": "ร้าน ABC",
  "referrer": "https://google.com",
  "userAgent": "...",
  "deviceType": "mobile",
  "browser": "Chrome",
  "os": "iOS",
  "tambonId": 123,
  "amphureId": 45,
  "provinceId": 6,
  "duration": 45                  // วินาที (optional)
}
```

### 2. Track Shop View
```typescript
POST /api/analytics/shop-view
{
  "sessionId": "session_123",
  "userId": "user_abc",           // optional
  "shopId": "shop_xyz",
  "viewDuration": 120,            // วินาที
  "sourceType": "search",         // search | category | featured | bookmark | direct
  "sourceId": "ส้มตำ",            // search query หรือ category ID
  "deviceType": "mobile",
  "tambonId": 123
}
```

### 3. Track Custom Event
```typescript
POST /api/analytics/event
{
  "sessionId": "session_123",
  "userId": "user_abc",           // optional
  "eventType": "shop_call",
  "eventData": {
    "phone": "0812345678",
    "button_location": "shop_detail"
  },
  "shopId": "shop_xyz",           // optional
  "provinceId": 6
}
```

**Event Types:**
- `shop_call` - โทรหาร้าน
- `shop_direction` - ขอเส้นทาง
- `shop_share` - แชร์ร้าน
- `bookmark_add` - เพิ่ม bookmark
- `search` - ค้นหา
- `category_click` - คลิกหมวดหมู่

### 4. Manage Session
```typescript
// Create or update session
POST /api/analytics/session
{
  "sessionId": "session_123",
  "userId": "user_abc",           // optional
  "deviceType": "mobile",
  "browser": "Chrome",
  "os": "iOS",
  "provinceId": 6,
  "utmSource": "facebook",
  "utmMedium": "social",
  "utmCampaign": "summer2024"
}

// End session
PUT /api/analytics/session
{
  "sessionId": "session_123"
}
```

### 5. Get Analytics Stats (Admin Only)
```typescript
GET /api/analytics/stats?period=7d&shopId=xyz

Response:
{
  "success": true,
  "period": "7d",
  "stats": {
    "totalPageViews": 12500,
    "uniqueVisitors": 3200,
    "totalSessions": 4100,
    "totalShopViews": 8900,
    "avgPageViewsPerSession": 3.0,
    "topPages": [
      { "path": "/shop/abc", "views": 450 },
      { "path": "/category/thai-food", "views": 320 }
    ],
    "topShops": [
      { "shopId": "xyz", "name": "ร้าน ABC", "views": 890 }
    ],
    "events": [
      { "type": "shop_call", "count": 125 },
      { "type": "bookmark_add", "count": 78 }
    ],
    "deviceBreakdown": [
      { "device": "mobile", "count": 7800 },
      { "device": "desktop", "count": 4700 }
    ],
    "dailyTrend": [
      { "date": "2024-01-15", "views": 1800, "sessions": 620 }
    ]
  }
}
```

---

## 🪝 React Hook: useAnalytics

### การใช้งาน

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyPage() {
  const { sessionId, trackShopView, trackEvent } = useAnalytics();

  // Auto-tracks:
  // - Page views (เมื่อเปลี่ยนหน้า)
  // - Session initialization
  // - Page duration (เมื่อออกจากหน้า)

  const handleShopClick = async (shopId: string) => {
    await trackShopView(shopId, 'category', 'thai-food');
  };

  const handleCall = async (shopId: string, phone: string) => {
    await trackEvent('shop_call', {
      phone,
      button_location: 'shop_detail'
    }, shopId);
  };

  const handleBookmark = async (shopId: string) => {
    await trackEvent('bookmark_add', null, shopId);
  };

  return (
    <div>
      <button onClick={() => handleShopClick('shop_123')}>
        ดูร้าน
      </button>
      <button onClick={() => handleCall('shop_123', '0812345678')}>
        โทร
      </button>
      <button onClick={() => handleBookmark('shop_123')}>
        บันทึก
      </button>
    </div>
  );
}
```

### Options
```typescript
const { ... } = useAnalytics({
  trackPageViews: true,   // default: true
  trackSessions: true,    // default: true
});
```

### Functions
- `trackShopView(shopId, sourceType?, sourceId?)` - บันทึกการดูร้าน
- `trackEvent(eventType, eventData?, shopId?)` - บันทึก custom event

---

## 🔧 Configuration

### Google Analytics Setup

#### วิธีที่ 1: ผ่าน Admin Panel
1. เข้า `/admin/settings`
2. หมวด **Analytics**
3. กรอก:
   - `google_analytics_id` → GA4 Measurement ID (เช่น `G-XXXXXXXXXX`)
   - `google_tag_manager_id` → GTM Container ID (เช่น `GTM-XXXXXX`)
4. บันทึก

#### วิธีที่ 2: ผ่าน Database
```sql
INSERT INTO site_settings (key, value, category)
VALUES
  ('google_analytics_id', 'G-XXXXXXXXXX', 'analytics'),
  ('google_tag_manager_id', 'GTM-XXXXXX', 'analytics');
```

#### วิธีที่ 3: ผ่าน API
```bash
curl -X POST /api/settings/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "google_analytics_id": "G-XXXXXXXXXX",
    "google_tag_manager_id": "GTM-XXXXXX"
  }'
```

---

## 📈 Views & Helper Queries

### shop_analytics View
รวมสถิติของแต่ละร้าน

```sql
CREATE VIEW shop_analytics AS
SELECT
  s.id as shop_id,
  s.name as shop_name,
  COUNT(DISTINCT sv.id) as total_views,
  COUNT(DISTINCT sv.session_id) as unique_visitors,
  AVG(sv.view_duration) as avg_duration,
  COUNT(DISTINCT CASE WHEN e.event_name = 'shop_call' THEN e.id END) as total_calls,
  COUNT(DISTINCT CASE WHEN e.event_name = 'bookmark_add' THEN e.id END) as total_bookmarks
FROM "Shop" s
LEFT JOIN shop_views sv ON s.id = sv.shop_id
LEFT JOIN events e ON s.id = e.shop_id
GROUP BY s.id, s.name;
```

### popular_pages View
หน้าที่ได้รับความนิยมสูงสุด

```sql
CREATE VIEW popular_pages AS
SELECT
  page_path,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(duration) as avg_duration
FROM page_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_path
ORDER BY total_views DESC;
```

---

## 📊 Example Queries

### Top 10 Shops (7 วันล่าสุด)
```sql
SELECT
  s.id,
  s.name,
  COUNT(sv.id) as views
FROM "Shop" s
JOIN shop_views sv ON s.id = sv.shop_id
WHERE sv.created_at >= NOW() - INTERVAL '7 days'
GROUP BY s.id, s.name
ORDER BY views DESC
LIMIT 10;
```

### Conversion Rate (View → Call)
```sql
SELECT
  s.id,
  s.name,
  COUNT(DISTINCT sv.session_id) as shop_views,
  COUNT(DISTINCT CASE WHEN e.event_name = 'shop_call' THEN e.session_id END) as calls,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.event_name = 'shop_call' THEN e.session_id END)::numeric /
    NULLIF(COUNT(DISTINCT sv.session_id), 0) * 100,
    2
  ) as conversion_rate
FROM "Shop" s
LEFT JOIN shop_views sv ON s.id = sv.shop_id
LEFT JOIN events e ON s.id = e.shop_id
GROUP BY s.id, s.name
ORDER BY conversion_rate DESC;
```

### Device Breakdown (วันนี้)
```sql
SELECT
  device_type,
  COUNT(*) as views,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM page_views
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY device_type
ORDER BY views DESC;
```

### Hourly Traffic Pattern
```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as views
FROM page_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

---

## 🚀 Best Practices

### 1. Session Management
- สร้าง session ID เมื่อผู้ใช้เข้ามาครั้งแรก
- เก็บใน localStorage
- อายุ session ควรเป็น 30 นาที (ตาม GA standard)

### 2. Event Tracking
- ใช้ event type ที่สอดคล้องกันทั้งระบบ
- เก็บ metadata ใน eventData เป็น JSON
- ตัวอย่าง:
```typescript
trackEvent('shop_call', {
  phone: '0812345678',
  button_location: 'shop_detail',
  timestamp: new Date().toISOString()
});
```

### 3. Privacy & GDPR
- ไม่เก็บ IP address แบบเต็ม (ควร mask 2 octets สุดท้าย)
- ให้ผู้ใช้ opt-out ได้
- ลบข้อมูลเก่าที่เกิน 90 วัน (ตาม retention policy)

### 4. Performance
- ใช้ `fetch()` แบบ fire-and-forget (ไม่ต้อง await)
- Batch events ถ้าจำเป็น
- ใช้ indexes ให้เหมาะสม

---

## 🛠️ Maintenance

### ลบข้อมูลเก่า (Retention Policy)
```sql
-- ลบ page views เก่ากว่า 90 วัน
DELETE FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';

-- ลบ shop views เก่ากว่า 90 วัน
DELETE FROM shop_views
WHERE created_at < NOW() - INTERVAL '90 days';

-- เก็บ daily_stats ไว้ 1 ปี
DELETE FROM daily_stats
WHERE stat_date < CURRENT_DATE - INTERVAL '365 days';
```

### สร้าง Daily Stats (Cron Job)
```sql
INSERT INTO daily_stats (
  stat_date,
  total_page_views,
  unique_visitors,
  total_sessions,
  total_shop_views,
  avg_session_duration,
  bounce_rate,
  top_pages,
  top_shops,
  device_breakdown
)
SELECT
  CURRENT_DATE - 1 as stat_date,
  COUNT(DISTINCT pv.id),
  COUNT(DISTINCT pv.session_id),
  COUNT(DISTINCT us.id),
  COUNT(DISTINCT sv.id),
  AVG(EXTRACT(EPOCH FROM (us.ended_at - us.started_at))),
  ... -- bounce rate calculation
FROM page_views pv
LEFT JOIN user_sessions us ON pv.session_id = us.session_id
LEFT JOIN shop_views sv ON pv.session_id = sv.session_id
WHERE DATE(pv.created_at) = CURRENT_DATE - 1;
```

---

## 📋 Checklist

- [x] ✅ Google Analytics component ติดตั้งแล้ว
- [x] ✅ Database tables สร้างแล้ว (6 tables)
- [x] ✅ Indexes & Views สร้างแล้ว
- [x] ✅ API endpoints พร้อมใช้งาน (5 endpoints)
- [x] ✅ React hook `useAnalytics` สร้างแล้ว
- [ ] ⏳ ตั้งค่า Google Analytics ID ใน Admin Panel
- [ ] ⏳ ทดสอบการเก็บข้อมูล
- [ ] ⏳ สร้าง Admin Dashboard สำหรับดูสถิติ
- [ ] ⏳ ตั้ง Cron job สำหรับ daily_stats aggregation
- [ ] ⏳ ตั้ง Retention policy (ลบข้อมูลเก่า)

---

## 🎓 ตัวอย่างการใช้งานจริง

### Shop Detail Page
```typescript
// src/app/shop/[shopId]/page.tsx
'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect } from 'react';

export default function ShopDetailPage({ params }) {
  const { trackShopView, trackEvent } = useAnalytics();
  
  useEffect(() => {
    // Track shop view when page loads
    trackShopView(params.shopId, 'direct');
  }, [params.shopId]);

  const handleCall = () => {
    trackEvent('shop_call', {
      phone: shop.phone,
      button_location: 'shop_detail'
    }, params.shopId);
    
    window.location.href = `tel:${shop.phone}`;
  };

  const handleDirection = () => {
    trackEvent('shop_direction', {
      lat: shop.lat,
      lng: shop.lng
    }, params.shopId);
    
    // Open Google Maps
  };

  return (
    <div>
      <button onClick={handleCall}>โทร</button>
      <button onClick={handleDirection}>เส้นทาง</button>
    </div>
  );
}
```

### Category Page
```typescript
export default function CategoryPage({ params }) {
  const { trackEvent } = useAnalytics();

  const handleShopClick = (shopId) => {
    trackShopView(shopId, 'category', params.slug);
    router.push(`/shop/${shopId}`);
  };

  return (
    <div>
      {shops.map(shop => (
        <div key={shop.id} onClick={() => handleShopClick(shop.id)}>
          {shop.name}
        </div>
      ))}
    </div>
  );
}
```

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ Browser Console สำหรับ errors
2. ตรวจสอบ database logs
3. ดู `/api/analytics/stats` เพื่อดูข้อมูลที่เก็บได้
4. ตรวจสอบว่า Google Analytics ID ตั้งค่าถูกต้อง

---

**อัปเดตล่าสุด:** 2024-01-15
