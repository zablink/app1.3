# 📋 Naming Convention Analysis & Standardization Plan

## 🔍 ปัญหาที่พบ (Current Issues)

### 1. **Database vs Prisma Naming Inconsistency**

#### ปัญหาหลัก:
- **Database (PostgreSQL)**: ใช้ `snake_case` (e.g., `shop_id`, `user_name`, `created_at`)
- **Prisma Schema**: ใช้ `camelCase` (e.g., `shopId`, `userName`, `createdAt`)
- **Mapping**: ใช้ `@map()` และ `@@map()` เชื่อมระหว่าง Prisma กับ Database

#### ตัวอย่างที่พบ:
```prisma
// Prisma Schema
model ShopReview {
  shopId      String   @map("shop_id")    // camelCase → snake_case
  userName    String   @map("user_name")
  createdAt   DateTime @map("created_at")
  
  @@map("shop_reviews")  // Model name → table name
}
```

---

### 2. **Enum Naming Inconsistency**

#### ปัญหาหลัก:
- **Subscription Enums**: ใช้ `snake_case`
  - `subscription_status` (ACTIVE, EXPIRED, CANCELLED, SUSPENDED)
  - `subscription_tier` (FREE, BASIC, PRO, PREMIUM)
  
- **Other Enums**: ใช้ `PascalCase`
  - `Role` (USER, SHOP, CREATOR, ADMIN)
  - `ShopStatus` (PENDING, APPROVED, REJECTED)
  - `CreatorStatus`, `AdScope`, `CreatorTier`, `ReviewStatus`

#### ตัวอย่าง:
```prisma
enum Role {              // ✅ PascalCase
  USER
  ADMIN
}

enum subscription_tier { // ❌ snake_case
  FREE
  BASIC
}
```

---

### 3. **Model Field Naming Patterns**

#### ปัญหาหลัก:
- **ส่วนใหญ่**: ใช้ `camelCase` (shopId, userName, createdAt)
- **บางจุด**: มีการใช้ `snake_case` โดยตรง
- **SiteSetting Model**: ใช้ `dataType` แต่ map เป็น `data_type`

#### ตัวอย่าง:
```prisma
model SiteSetting {
  dataType    String   @default("string") @map("data_type")  // Inconsistent
  updatedBy   String?  @map("updated_by")
}

model Shop {
  lineManUrl    String?  @map("lineman_url")   // camelCase → snake_case
  grabFoodUrl   String?  @map("grabfood_url")
}
```

---

### 4. **TypeScript Interface vs Prisma Model**

#### ปัญหาหลัก:
- **Frontend Types**: ใช้ `camelCase` (shopId, userName)
- **Database Insert Types**: ใช้ `snake_case` (shop_id, user_name)
- **API Responses**: บางจุดใช้ `camelCase`, บางจุดใช้ `snake_case`

#### ตัวอย่างจาก `/src/types/shop.ts`:
```typescript
// Frontend interface
export interface ShopData {
  id: string;
  ownerId: string;
  name: string;
  categoryId: string;
}

// Database insert interface
export interface ShopDbInsert {
  id: string;
  ownerId: string;          // ⚠️ Mixed: should be owner_id
  categoryId: string;       // ⚠️ Mixed: should be category_id
  has_physical_store: boolean;  // ✅ snake_case
  show_location_on_map: boolean; // ✅ snake_case
}
```

---

### 5. **API Route Naming**

#### ปัญหาหลัก:
- **Folder Structure**: ใช้ `kebab-case` (e.g., `/api/review-request`, `/api/subscription-plans`)
- **File Names**: ใช้ `kebab-case` (e.g., `check-shop-subscriptions.ts`)
- **Function Names**: ใช้ `camelCase` (e.g., `handleSubmit`, `fetchShopData`)

---

## ✅ มาตรฐานที่แนะนำ (Recommended Standards)

### **🎯 Standard #1: Prisma Schema**
```prisma
// ✅ Model names: PascalCase
model ShopReview { ... }
model SubscriptionPackage { ... }

// ✅ Field names: camelCase
shopId      String
userName    String
createdAt   DateTime

// ✅ Map to database: snake_case
shopId      String   @map("shop_id")
userName    String   @map("user_name")
createdAt   DateTime @map("created_at")

// ✅ Table names: snake_case
@@map("shop_reviews")
```

### **🎯 Standard #2: Enum Naming**
```prisma
// ✅ ALL enums use PascalCase
enum SubscriptionStatus {  // Changed from subscription_status
  ACTIVE
  EXPIRED
  CANCELLED
  SUSPENDED
}

enum SubscriptionTier {    // Changed from subscription_tier
  FREE
  BASIC
  PRO
  PREMIUM
}
```

### **🎯 Standard #3: TypeScript Types**
```typescript
// ✅ Frontend: camelCase
interface ShopData {
  id: string;
  shopId: string;
  userName: string;
  createdAt: Date;
}

// ✅ Database: snake_case (only for raw SQL)
interface ShopDbRow {
  shop_id: string;
  user_name: string;
  created_at: string;
}
```

### **🎯 Standard #4: API Routes**
```typescript
// ✅ Folders: kebab-case
/api/subscription-plans
/api/review-request

// ✅ Request/Response: camelCase
{
  shopId: "abc123",
  userName: "John",
  createdAt: "2025-01-01"
}
```

### **🎯 Standard #5: File Naming**
```
✅ Components: PascalCase.tsx     (e.g., ShopCard.tsx)
✅ Pages: kebab-case              (e.g., shop/[id]/page.tsx)
✅ Utils: camelCase.ts            (e.g., imageCompression.ts)
✅ Scripts: kebab-case.ts         (e.g., seed-delivery-links.ts)
✅ Types: camelCase.ts            (e.g., shop.ts, auth.ts)
```

---

## 🔧 การแก้ไขที่ต้องทำ (Required Changes)

### **Phase 1: Enum Standardization** (High Priority)

#### Files to change:
1. `/prisma/schema.prisma`
   - Rename `subscription_status` → `SubscriptionStatus`
   - Rename `subscription_tier` → `SubscriptionTier`

2. Create migration:
   ```sql
   -- Rename enums in database
   ALTER TYPE subscription_status RENAME TO subscription_status_old;
   CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
   
   ALTER TYPE subscription_tier RENAME TO subscription_tier_old;
   CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');
   ```

3. Update all references:
   - Search for `subscription_status` → replace with `SubscriptionStatus`
   - Search for `subscription_tier` → replace with `SubscriptionTier`

---

### **Phase 2: TypeScript Interface Cleanup** (Medium Priority)

#### Files to change:
1. `/src/types/shop.ts`
   - Fix `ShopDbInsert` to use consistent `snake_case`:
   ```typescript
   export interface ShopDbInsert {
     id: string;
     owner_id: string;        // Fixed
     category_id: string;     // Fixed
     has_physical_store: boolean;
     show_location_on_map: boolean;
     created_at: string;      // Added
     updated_at: string;      // Added
   }
   ```

2. `/src/types/auth.ts`, `/src/types/creator.ts`
   - Review and standardize all interfaces

---

### **Phase 3: Database Mapping Validation** (Low Priority)

#### Files to check:
1. All models in `/prisma/schema.prisma`
   - Verify all `@map()` directives are present
   - Ensure `@@map()` for all tables

2. Verify database column names:
   ```sql
   -- Check actual column names in PostgreSQL
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'shops';
   ```

---

### **Phase 4: API Response Standardization** (Medium Priority)

#### Current issues:
- Some APIs return `snake_case` (raw DB results)
- Some APIs return `camelCase` (Prisma results)

#### Solution:
```typescript
// ✅ Always serialize to camelCase for API responses
export async function GET(req: Request) {
  const data = await prisma.shop.findMany(); // Already camelCase
  return NextResponse.json(data);            // ✅ Consistent
}

// ❌ Avoid raw SQL unless necessary
const rawData = await prisma.$queryRaw`SELECT shop_id, user_name FROM shops`;
// Need to transform: shop_id → shopId, user_name → userName
```

---

## 📊 Impact Analysis

### High Impact Changes:
1. **Enum Renaming** → Requires database migration + code updates
   - Affected files: ~15-20 files
   - Risk: Medium (breaking change if not careful)
   - Time: 2-3 hours

### Medium Impact Changes:
2. **TypeScript Interface Cleanup** → Frontend only
   - Affected files: ~10 files
   - Risk: Low (type checking will catch errors)
   - Time: 1-2 hours

3. **API Response Standardization** → Backend API routes
   - Affected files: ~20 API routes
   - Risk: Medium (clients may break)
   - Time: 2-4 hours

### Low Impact Changes:
4. **Documentation & Comments** → No code changes
   - Affected files: All files
   - Risk: None
   - Time: 1 hour

---

## 🚀 Implementation Plan

### Step 1: Backup & Preparation
```bash
# 1. Create git branch
git checkout -b refactor/naming-convention

# 2. Backup database
pg_dump $DATABASE_URL > backup_before_refactor.sql

# 3. Run tests (if any)
npm run test
```

### Step 2: Prisma Schema Updates
1. Update enum names in `schema.prisma`
2. Update all model references
3. Generate new Prisma client
   ```bash
   npx prisma format
   npx prisma generate
   ```

### Step 3: Database Migration
1. Create migration file manually
2. Review SQL changes
3. Test on development database
   ```bash
   npx prisma migrate dev --name standardize-naming-convention
   ```

### Step 4: Code Updates
1. Find & replace `subscription_status` → `SubscriptionStatus`
2. Find & replace `subscription_tier` → `SubscriptionTier`
3. Update TypeScript interfaces
4. Fix API routes

### Step 5: Testing & Validation
1. Run TypeScript compiler: `npm run build`
2. Test API endpoints
3. Test database queries
4. Verify frontend still works

### Step 6: Documentation
1. Update this document with final changes
2. Update README.md with new standards
3. Create CONTRIBUTING.md with naming guidelines

---

## 📝 Naming Convention Reference Guide

### Quick Reference Table

| Context | Standard | Example | Notes |
|---------|----------|---------|-------|
| **Prisma Models** | PascalCase | `ShopReview`, `SubscriptionPackage` | Model definitions |
| **Prisma Fields** | camelCase | `shopId`, `userName`, `createdAt` | Field names in code |
| **Database Tables** | snake_case | `shop_reviews`, `subscription_packages` | Via `@@map()` |
| **Database Columns** | snake_case | `shop_id`, `user_name`, `created_at` | Via `@map()` |
| **Enums** | PascalCase | `SubscriptionStatus`, `SubscriptionTier` | All enums |
| **Enum Values** | UPPER_CASE | `ACTIVE`, `PREMIUM` | Enum options |
| **TypeScript Interfaces** | PascalCase | `ShopData`, `ReviewData` | Type definitions |
| **TypeScript Fields** | camelCase | `shopId`, `userName` | Interface properties |
| **API Routes** | kebab-case | `/api/subscription-plans` | URL paths |
| **Component Files** | PascalCase | `ShopCard.tsx`, `Hero.tsx` | React components |
| **Utility Files** | camelCase | `imageCompression.ts` | Helper functions |
| **Script Files** | kebab-case | `seed-delivery-links.ts` | Executable scripts |
| **Functions** | camelCase | `fetchShopData()`, `handleSubmit()` | All functions |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` | Global constants |
| **React Props** | camelCase | `shopId`, `onSubmit` | Component props |
| **CSS Classes** | kebab-case | `shop-card`, `hero-banner` | Class names |

---

## ⚠️ Breaking Changes Warning

### Changes that require migration:
1. ✅ Enum name changes (requires DB migration)
2. ✅ API response format changes (may break frontend)
3. ⚠️ Database column renames (NOT recommended - use mapping instead)

### Safe changes:
1. ✅ TypeScript interface updates (caught by compiler)
2. ✅ Prisma field names (mapped to DB)
3. ✅ Component/file renames (imports updated by IDE)

---

## 📚 Resources

- [Prisma Naming Conventions](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#naming-conventions)
- [TypeScript Coding Guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- [Next.js App Router Conventions](https://nextjs.org/docs/app/building-your-application/routing)
- [PostgreSQL Naming Best Practices](https://www.postgresql.org/docs/current/ddl-schemas.html)

---

## ✅ Checklist

### Before Starting:
- [ ] Create git branch
- [ ] Backup database
- [ ] Document current state
- [ ] Get team approval

### During Refactoring:
- [ ] Update Prisma schema
- [ ] Create migration files
- [ ] Update TypeScript types
- [ ] Fix API routes
- [ ] Update frontend components
- [ ] Run tests

### After Refactoring:
- [ ] Verify build succeeds
- [ ] Test all API endpoints
- [ ] Test frontend functionality
- [ ] Update documentation
- [ ] Code review
- [ ] Merge to main

---

**Last Updated**: 21 November 2025
**Status**: 📋 Analysis Complete - Ready for Implementation
**Priority**: 🔴 High (Foundation for future development)
