# Location Validation

## Invalid Coordinates ที่ต้อง Ignore

### 1. Default GPS Error Values
```typescript
lat === 0 && lng === 0  // ❌ ค่า default เมื่อ GPS จับไม่ได้
lat === null || lng === null  // ❌ ไม่มีข้อมูล
```

### 2. Thailand Boundaries (Approximate)
```typescript
// ✅ พิกัดที่ถูกต้องต้องอยู่ใน range นี้
lat: 5.5°N to 21°N
lng: 97°E to 106°E
```

**ที่มา:** 
- ละติจูดต่ำสุด: เกาะสุไหงโกลก จ.นราธิวาส (~5.6°N)
- ละติจูดสูงสุด: บ้านแม่สาย จ.เชียงราย (~20.4°N)
- ลองจิจูดต่ำสุด: อ.แม่สาย จ.เชียงราย (~97.7°E)
- ลองจิจูดสูงสุด: อ.ปากชม จ.เลย (~105.6°E)

## Implementation

### Frontend (`/src/app/shop/page.tsx`)
```typescript
function isValidThailandLocation(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return false;
  if (lat === 0 && lng === 0) return false; // Default GPS error
  
  // Thailand boundaries (approximate)
  const inThailand = lat >= 5.5 && lat <= 21 && lng >= 97 && lng <= 106;
  return inThailand;
}
```

### Backend API (`/src/app/api/shops/route.ts`)
```typescript
function isValidThailandCoordinates(lat: number, lng: number): boolean {
  if (lat === 0 && lng === 0) return false; // Default GPS error
  // Thailand boundaries (approximate): 5.5°N to 21°N, 97°E to 106°E
  return lat >= 5.5 && lat <= 21 && lng >= 97 && lng <= 106;
}
```

### Scripts (`/scripts/update-shop-locations.ts`)
```typescript
// Ignore invalid/default coordinates
if (shop.lat === 0 && shop.lng === 0) {
  console.log(`⚠️  ${shop.name}: Default coordinates (0,0) - skipping`);
  continue;
}

// Check if within Thailand boundaries
if (shop.lat < 5.5 || shop.lat > 21 || shop.lng < 97 || shop.lng > 106) {
  console.log(`⚠️  ${shop.name}: Outside Thailand - skipping`);
  continue;
}
```

## Use Cases

### ✅ Valid Locations
```
กรุงเทพฯ: (13.7563, 100.5018)
เชียงใหม่: (18.7883, 98.9853)
ภูเก็ต: (7.8804, 98.3923)
```

### ❌ Invalid Locations (Will be Ignored)
```
GPS Error: (0, 0)
Null Island: (0.0, 0.0)
Outside Thailand: (25.0, 110.0)
Missing: (null, null)
```

## Benefits

1. **🚫 ป้องกัน GPS Error**: ไม่แสดงร้านที่ GPS จับไม่ได้
2. **🎯 ความแม่นยำ**: แสดงเฉพาะร้านที่อยู่ในประเทศไทย
3. **📊 Data Quality**: กรองข้อมูลไม่ถูกต้องออกก่อนประมวลผล
4. **🔍 Better UX**: ผลลัพธ์การค้นหาแม่นยำและเชื่อถือได้

## Testing

```bash
# ทดสอบ script กับข้อมูลจริง
npx tsx scripts/update-shop-locations.ts

# ควรเห็น log แบบนี้:
# ⚠️  ร้าน XXX: Default coordinates (0,0) - skipping
# ⚠️  ร้าน YYY: Outside Thailand (25.0, 110.0) - skipping
# ✅  ร้าน ZZZ: Updated (P:1, A:1019, T:101905)
```
