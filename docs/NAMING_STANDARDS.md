# Naming Standards & Conventions

## ⚠️ Critical: Database Column Names

### ✅ CORRECT Standard Names (ใช้ตามนี้เท่านั้น!)

| Table | Column Name | Type | Description |
|-------|------------|------|-------------|
| `shop_subscriptions` | **`package_id`** | `TEXT` | Foreign key to subscription_packages |
| `shop_subscriptions` | `shop_id` | `TEXT` | Foreign key to Shop |
| `Campaign` | `adPackageId` | `String?` | Foreign key to AdPackage (Prisma naming) |
| `CampaignJob` | `adPackageId` | `String?` | Foreign key to AdPackage (Prisma naming) |

### ❌ DEPRECATED Names (อย่าใช้!)

| Deprecated | Correct | Status | Action |
|-----------|---------|--------|---------|
| ~~`plan_id`~~ | `package_id` | ⚠️ Legacy column exists but unused | Do NOT use in new code |
| ~~`planId`~~ | `packageId` | ❌ Wrong name | Use `packageId` in TypeScript/API |

---

## 📋 Naming Rules by Context

### 1. Database Schema (PostgreSQL)
```sql
-- ✅ CORRECT: snake_case
shop_subscriptions.package_id
shop_subscriptions.shop_id
shop_subscriptions.start_date
shop_subscriptions.end_date

-- ❌ WRONG
shop_subscriptions.plan_id  -- DEPRECATED!
```

### 2. Prisma Schema
```prisma
// ✅ CORRECT: camelCase for Prisma models, snake_case for DB columns
model ShopSubscription {
  packageId  String  @map("package_id")  // Maps to DB column
  shopId     String  @map("shop_id")
  
  // Relation
  package    SubscriptionPackage @relation(fields: [packageId], references: [id])
}

// ❌ WRONG
model ShopSubscription {
  planId  String  @map("plan_id")  // NEVER USE THIS!
}
```

### 3. TypeScript/API (Frontend/Backend)
```typescript
// ✅ CORRECT: camelCase
interface AssignPackageRequest {
  packageId: string;
  shopId: string;
  tokenAmount: number;
}

const { packageId } = await request.json();

// ❌ WRONG
const { planId } = await request.json();  // DEPRECATED!
```

### 4. SQL Queries (Raw)
```typescript
// ✅ CORRECT: Use package_id in SQL
const query = `
  SELECT ss.id, ss.package_id, sp.tier
  FROM shop_subscriptions ss
  JOIN subscription_packages sp ON ss.package_id = sp.id
  WHERE ss.shop_id = $1
`;

// ❌ WRONG
const query = `
  JOIN subscription_packages sp ON ss.plan_id = sp.id  -- WRONG!
`;
```

---

## 🔍 Common Mistakes & How to Fix

### Mistake 1: Using `plan_id` in JOIN
```sql
-- ❌ WRONG
JOIN subscription_packages sp ON ss.plan_id = sp.id

-- ✅ CORRECT
JOIN subscription_packages sp ON ss.package_id = sp.id
```

### Mistake 2: Using `planId` in API
```typescript
// ❌ WRONG
const { planId } = await request.json();

// ✅ CORRECT
const { packageId } = await request.json();
```

### Mistake 3: Mixed naming in one query
```sql
-- ❌ WRONG (mixing plan_id and package_id)
SELECT plan_id FROM shop_subscriptions WHERE package_id = $1

-- ✅ CORRECT (use package_id consistently)
SELECT package_id FROM shop_subscriptions WHERE package_id = $1
```

---

## 🛠️ Migration Strategy

### Current State
- Database has BOTH `package_id` (correct) and `plan_id` (deprecated)
- `plan_id` is nullable and should be ignored
- All new code uses `package_id`

### To Fix Existing Code

1. **Search for usage:**
   ```bash
   grep -r "plan_id\|planId" src/
   ```

2. **Replace pattern:**
   - SQL: `ss.plan_id` → `ss.package_id`
   - TypeScript: `planId` → `packageId`
   - Prisma: Keep using `packageId` (already correct)

3. **Verify in these files:**
   - ✅ `/src/app/api/shops/route.ts` - Fixed
   - ✅ `/src/app/api/admin/shops/route.ts` - Uses `package_id`
   - ⚠️ `/src/app/api/shops/[id]/route.ts` - Check needed
   - ⚠️ `/src/app/api/shops/[id]/subscription/route.ts` - Still uses `planId`
   - ⚠️ `/scripts/seed-test-subscriptions.ts` - Uses both!

---

## 📝 Checklist Before Deploying

- [ ] No references to `plan_id` in SQL queries
- [ ] No references to `planId` in TypeScript/API
- [ ] All JOINs use `package_id`
- [ ] Prisma schema uses `@map("package_id")`
- [ ] API endpoints accept `packageId` parameter
- [ ] Tests updated to use `packageId`

---

## 🚨 Files That Need Fixing

Based on grep results, these files still have issues:

### High Priority (Break functionality)
1. **`/src/app/api/shops/[id]/route.ts:44`**
   - Line: `JOIN subscription_packages sp ON ss.plan_id = sp.id`
   - Fix: Change to `package_id`

2. **`/src/app/api/shops/[id]/subscription/route.ts:28-40`**
   - Uses `planId` parameter
   - Fix: Change to `packageId` throughout

### Medium Priority (Scripts/Testing)
3. **`/scripts/seed-test-subscriptions.ts`**
   - Uses both `planId` and `package_id`
   - Fix: Standardize to `packageId`/`package_id`

### Low Priority (Legacy/Migrations)
4. **`/prisma/schema.prisma:230`**
   - Has `plan_id String?` field
   - Keep for backward compatibility but don't use

---

## 💡 Best Practices

1. **Always use `packageId`/`package_id`** for subscription packages
2. **Search before writing** - Check if similar code exists
3. **Review schema** - Verify column names in `prisma/schema.prisma`
4. **Test queries** - Run SQL in DB console before adding to code
5. **Document deviations** - If you must use different naming, add comments

---

## 🔗 Related Documentation

- Prisma Schema: `/prisma/schema.prisma`
- Database Migrations: `/prisma/migrations/`
- API Documentation: `/docs/API.md`
- Type Definitions: `/src/types/`

---

**Last Updated:** 2025-11-22
**Version:** 1.0
**Status:** 🟢 Active Standard
