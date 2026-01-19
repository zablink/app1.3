# Quick Reference: Naming Standards

## 🎯 Golden Rules

### 1. Subscription Package References
```typescript
// ✅ ALWAYS use these names:
packageId   // TypeScript/JavaScript
package_id  // SQL/Database

// ❌ NEVER use:
planId      // DEPRECATED
plan_id     // DEPRECATED
```

### 2. Quick Check Before Commit
```bash
# Run this before committing:
./scripts/check-naming-standards.sh

# If all clear, you'll see:
# ✅ All naming standards check passed!
```

### 3. Auto-Install Git Hook (Optional)
```bash
# This will check automatically on every commit:
chmod +x scripts/pre-commit-naming-check.sh
cp scripts/pre-commit-naming-check.sh .git/hooks/pre-commit
```

## 📖 Common Patterns

### API Endpoint
```typescript
// ✅ CORRECT
export async function POST(request: NextRequest) {
  const { packageId, shopId } = await request.json();
  
  await prisma.shopSubscription.create({
    data: {
      shopId,
      packageId,  // This maps to package_id in DB
      // ...
    }
  });
}
```

### SQL Query
```typescript
// ✅ CORRECT
const query = `
  SELECT ss.id, ss.package_id, sp.name
  FROM shop_subscriptions ss
  JOIN subscription_packages sp ON ss.package_id = sp.id
  WHERE ss.shop_id = $1
`;
```

### React Component
```typescript
// ✅ CORRECT
interface SubscriptionFormProps {
  packageId: string;
  onSubmit: (packageId: string) => void;
}

function SubscriptionForm({ packageId }: SubscriptionFormProps) {
  // ...
}
```

## 🚨 If You See Errors

```bash
❌ Found deprecated 'plan_id' usage:
src/app/api/example.ts:42: JOIN ... ON ss.plan_id = sp.id
```

**Fix:**
```typescript
// Change line 42 from:
JOIN subscription_packages sp ON ss.plan_id = sp.id

// To:
JOIN subscription_packages sp ON ss.package_id = sp.id
```

## 📚 Full Documentation

See [NAMING_STANDARDS.md](./NAMING_STANDARDS.md) for complete guide.

## ⚡ Emergency Override

If you absolutely need to commit despite warnings:
```bash
git commit --no-verify -m "Your message"
```

**Note:** Only use `--no-verify` if you're sure the warnings are false positives!
