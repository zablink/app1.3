# Zablink - Food & Creator Platform

แพลตฟอร์มเชื่อมต่อร้านอาหาร นักรีวิว และผู้ใช้งาน

## 🚀 Quick Start

```bash
# Install dependencies (auto-setup git hooks)
npm install

# Setup env
cp env.example .env.local

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

## ⚠️ Important: Before Committing

```bash
# Check for route conflicts (critical!)
npm run check:routes

# Check naming standards
npm run check:naming

# Build to verify everything works
npm run build
```

## 🔐 Security Notes

- **Never commit** `.env` / `.env.local` (secrets). Use `env.example` as template.
- **Debug APIs** under `/api/debug/*` are blocked in production unless you set `DEBUG_API_SECRET`
  and send header `x-debug-secret: <DEBUG_API_SECRET>`.

## 📚 Documentation

**Start here:**
- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) - Setup guide & common issues
- [ROUTE_STRUCTURE_GUIDE.md](./ROUTE_STRUCTURE_GUIDE.md) - **Must read!** Prevents build errors

**Feature guides:**
- [FAVICON_GUIDE.md](./FAVICON_GUIDE.md) - Multi-size favicon management
- [ADMIN_SETTINGS_GUIDE.md](./ADMIN_SETTINGS_GUIDE.md) - Admin dashboard
- [NAMING_STANDARDS.md](./docs/NAMING_STANDARDS.md) - Code conventions

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (with auto-checks) |
| `npm run check:routes` | ⚠️ **Check route conflicts** |
| `npm run check:naming` | Check naming conventions |
| `npm run lint` | Run ESLint |

## 🔧 Auto-Checks

The project has automated checks to prevent common errors:

### Pre-commit Hook
Runs automatically on `git commit`:
- ✅ Checks for route conflicts (page.tsx + route.ts in same folder)
- ❌ Blocks commit if conflicts found

### Pre-build Hook  
Runs automatically on `npm run build`:
- ✅ Validates route structure
- ❌ Fails build if conflicts detected

## 🚨 Common Error

```
You cannot have two parallel pages that resolve to the same path.
Please check /admin/dashboard/page and /admin/dashboard/route.
```

**Cause:** Both `page.tsx` and `route.ts` in same folder  
**Fix:** Read [ROUTE_STRUCTURE_GUIDE.md](./ROUTE_STRUCTURE_GUIDE.md)  
**Prevention:** Hooks will catch this before commit/build

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/            # Admin UI pages
│   ├── shop/             # Shop UI pages
│   ├── api/              # API routes (all route.ts here)
│   │   ├── admin/
│   │   ├── shop/
│   │   └── auth/
│   └── ...
├── components/
├── lib/
└── utils/
```

**Golden Rule:** `route.ts` files go in `/api` folder, NOT with `page.tsx` files!

## 🎯 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js
- **Storage:** Supabase
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## 🐛 Troubleshooting

### Build fails with route conflict
```bash
npm run check:routes
# Fix the conflicts shown
# Read ROUTE_STRUCTURE_GUIDE.md
```

### Git hook not running
```bash
./scripts/setup-git-hooks.sh
```

### Database issues
```bash
npx prisma generate
npx prisma db push
```

## 🤝 Contributing

1. Read [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
2. Create branch from `dev`
3. Make changes
4. Run checks: `npm run check:routes`
5. Commit (hooks run automatically)
6. Push and create PR

## 📞 Need Help?

1. Check documentation files (*.md in root)
2. Run `npm run check:routes` for route issues
3. Review error messages carefully
4. Ask team if stuck

---

**Remember:** The automated checks are your friends! They catch errors before deployment. ✨
