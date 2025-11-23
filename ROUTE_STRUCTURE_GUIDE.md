# Next.js Route Structure Guide

## ⚠️ Common Error: Route Conflicts

### The Problem

```
You cannot have two parallel pages that resolve to the same path.
Please check /admin/dashboard/page and /admin/dashboard/route.
```

This error occurs when a folder contains **both** `page.tsx` and `route.ts`.

### Why This Happens

In Next.js App Router:
- **`page.tsx`** = UI page (renders HTML/JSX)
- **`route.ts`** = API endpoint (returns JSON/Response)

These serve different purposes and **cannot coexist** in the same folder.

## 📁 Correct Folder Structure

```
src/app/
├── admin/
│   ├── dashboard/
│   │   └── page.tsx          ✅ UI page
│   └── settings/
│       └── page.tsx          ✅ UI page
│
└── api/
    └── admin/
        ├── dashboard/
        │   └── route.ts      ✅ API endpoint
        └── settings/
            └── route.ts      ✅ API endpoint
```

## 🎯 Rules

### 1. UI Pages → `/app/[path]/page.tsx`
```typescript
// src/app/admin/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard UI</div>;
}
```

### 2. API Routes → `/app/api/[path]/route.ts`
```typescript
// src/app/api/admin/dashboard/route.ts
export async function GET(request: Request) {
  return Response.json({ data: "..." });
}
```

### 3. Never Mix Them
```
❌ BAD:
/app/admin/dashboard/
  ├── page.tsx    ← UI
  └── route.ts    ← API (CONFLICT!)

✅ GOOD:
/app/admin/dashboard/
  └── page.tsx    ← UI only

/app/api/admin/dashboard/
  └── route.ts    ← API only
```

## 🔧 Prevention Tools

### 1. Pre-commit Check (Automatic)

```bash
# Added to package.json
npm run check:routes
```

This runs automatically before build:
```json
{
  "scripts": {
    "prebuild": "bash scripts/check-route-conflicts.sh"
  }
}
```

### 2. Manual Check

```bash
# Run anytime
./scripts/check-route-conflicts.sh
```

### 3. Find Conflicts Manually

```bash
# Find folders with both page.tsx and route.ts
find src/app -type d -exec sh -c '
  if [ -f "$1/page.tsx" ] && [ -f "$1/route.ts" ]; then
    echo "CONFLICT: $1"
  fi
' _ {} \;
```

## 🚨 Common Mistakes & Fixes

### Mistake 1: API route in wrong location

```
❌ src/app/admin/dashboard/route.ts
✅ src/app/api/admin/dashboard/route.ts
```

**Fix:**
```bash
mkdir -p src/app/api/admin/dashboard
mv src/app/admin/dashboard/route.ts src/app/api/admin/dashboard/
```

### Mistake 2: Mixed API and UI

```
❌ src/app/shop/[id]/
    ├── page.tsx   (show shop details)
    └── route.ts   (API to get shop data)
```

**Fix:** Separate them
```
✅ src/app/shop/[id]/
    └── page.tsx

✅ src/app/api/shop/[id]/
    └── route.ts
```

### Mistake 3: Server Actions vs Route Handlers

Don't need `route.ts` for simple data fetching:

```typescript
// ❌ Overkill - creating route.ts just to fetch data
// src/app/api/shops/route.ts
export async function GET() {
  const shops = await prisma.shop.findMany();
  return Response.json(shops);
}

// ✅ Better - use Server Component
// src/app/shops/page.tsx
async function getShops() {
  return await prisma.shop.findMany();
}

export default async function ShopsPage() {
  const shops = await getShops();
  return <div>{/* render shops */}</div>;
}
```

## 📊 When to Use What

| Scenario | Use |
|----------|-----|
| Display HTML page | `page.tsx` |
| Server-side data fetching for page | Server Component |
| API endpoint for client | `route.ts` in `/api` |
| Form submission | Server Action or `route.ts` |
| Webhook receiver | `route.ts` in `/api` |
| External API consumer | `route.ts` in `/api` |
| Protected admin page | `page.tsx` + middleware |
| Protected admin API | `route.ts` in `/api` + auth check |

## 🔍 Debugging Route Issues

### Check build errors
```bash
npm run build
```

### Check route structure
```bash
npm run check:routes
```

### View all routes
```bash
# Find all pages
find src/app -name "page.tsx" -o -name "page.ts"

# Find all API routes
find src/app/api -name "route.ts"
```

### Check specific folder
```bash
ls -la src/app/admin/dashboard/
# Should have EITHER page.tsx OR route.ts, not both
```

## 📝 Migration Checklist

When you encounter the conflict error:

- [ ] Identify the conflicting folder (from error message)
- [ ] Determine which file is the API route
- [ ] Create proper `/api` path if needed
- [ ] Move `route.ts` to `/api/[path]/`
- [ ] Update imports/fetch calls to new API path
- [ ] Test the application
- [ ] Run `npm run check:routes`
- [ ] Commit changes

## 🎓 Best Practices

### 1. Consistent Structure
```
app/
├── (pages)/              # All UI pages
│   ├── admin/
│   ├── shop/
│   └── dashboard/
└── api/                  # All API routes
    ├── admin/
    ├── shop/
    └── auth/
```

### 2. Server Components First
Use Server Components for data fetching when possible:
```typescript
// ✅ Preferred
async function ShopPage({ params }) {
  const shop = await prisma.shop.findUnique({ 
    where: { id: params.id } 
  });
  return <div>{shop.name}</div>;
}

// ⚠️ Only when needed (client-side fetching, webhooks, etc.)
// api/shop/[id]/route.ts
```

### 3. Group Routes
```
api/
├── admin/          # Admin-only endpoints
├── public/         # Public endpoints
├── auth/           # Authentication
└── webhooks/       # External webhooks
```

### 4. Naming Conventions
- Page files: `page.tsx` (always)
- API routes: `route.ts` (always)
- Layouts: `layout.tsx`
- Loading: `loading.tsx`
- Error: `error.tsx`

## 🛠️ Tools & Scripts

### Available Commands

```bash
# Check for route conflicts
npm run check:routes

# Check naming standards
npm run check:naming

# Both checks before build
npm run prebuild

# Development with auto-reload
npm run dev

# Production build (includes checks)
npm run build
```

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "files.exclude": {
    "**/.next": true,
    "**/.vercel": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true
  }
}
```

## 🔗 Resources

- [Next.js Routing Docs](https://nextjs.org/docs/app/building-your-application/routing)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## ❓ FAQ

**Q: Can I have both `page.tsx` and `route.ts` in different subfolders?**  
A: Yes! Different folders are fine:
```
✅ app/shop/page.tsx
✅ app/shop/[id]/route.ts
```

**Q: What about Server Actions?**  
A: Server Actions don't need `route.ts`:
```typescript
// app/actions.ts
'use server'
export async function submitForm(data) { ... }
```

**Q: How do I migrate existing routes?**  
A: Move API routes to `/api` folder and update fetch URLs in your components.

**Q: Will this break my app?**  
A: The check script prevents builds with conflicts. Fix before deploying.
