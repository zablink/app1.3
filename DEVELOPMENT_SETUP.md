# Development Setup & Guidelines

## Quick Start

```bash
# Install dependencies (will auto-setup git hooks)
npm install

# Run development server
npm run dev

# Before committing
npm run check:routes    # Check route conflicts
npm run check:naming    # Check naming standards
```

## 🚨 Common Issues & Prevention

### Issue 1: Route Conflicts (page.tsx + route.ts)

**Error:**
```
You cannot have two parallel pages that resolve to the same path.
```

**Prevention:** Automatic checks run on:
- `git commit` (pre-commit hook)
- `npm run build` (prebuild hook)
- Manual: `npm run check:routes`

**Solution:** See [ROUTE_STRUCTURE_GUIDE.md](./ROUTE_STRUCTURE_GUIDE.md)

### Issue 2: Naming Standards

**Prevention:**
```bash
npm run check:naming
```

**Guidelines:** See [NAMING_STANDARDS.md](./docs/NAMING_STANDARDS.md)

## 📁 Project Structure

```
src/
├── app/
│   ├── (pages)/           # UI pages only
│   │   ├── admin/
│   │   ├── shop/
│   │   └── dashboard/
│   └── api/               # API routes only
│       ├── admin/
│       ├── shop/
│       └── auth/
├── components/
├── lib/
└── utils/
```

**Rule:** Never mix `page.tsx` and `route.ts` in the same folder!

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (with checks) |
| `npm run check:routes` | Check for route conflicts |
| `npm run check:naming` | Check naming conventions |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Prisma generate + `tsc --noEmit` (ต้อง `npm install` ก่อน) |
| `npm run typecheck:docker` | เหมือน typecheck แต่รันใน Docker (Mac เก่าที่ esbuild พัง) |

### Prisma / Typecheck

- ใช้ **Prisma 6** ตาม `package.json` — รันผ่าน `prisma` หลัง `npm install` เท่านั้น
- **อย่า** รัน `npx prisma` โดยไม่มี dependency ในโปรเจกต์ (จะโหลด Prisma 7 แล้ว schema พัง)

## 🔧 Git Hooks

Hooks are automatically installed when you run `npm install`.

### Pre-commit Hook
Runs before every commit:
- ✅ Checks for route conflicts
- ❌ Blocks commit if conflicts found

### Manual Setup
```bash
./scripts/setup-git-hooks.sh
```

### Skip Hook (Not Recommended)
```bash
git commit --no-verify
```

## 📚 Documentation

- [Route Structure Guide](./ROUTE_STRUCTURE_GUIDE.md) - Next.js routing best practices
- [Favicon Guide](./FAVICON_GUIDE.md) - Favicon management
- [Naming Standards](./docs/NAMING_STANDARDS.md) - Code naming conventions
- [Admin Guide](./ADMIN_SETTINGS_GUIDE.md) - Admin dashboard usage

## 🎯 Before Push Checklist

- [ ] No route conflicts: `npm run check:routes`
- [ ] Naming standards followed: `npm run check:naming`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass (if applicable)
- [ ] No console errors in browser

## 🐛 Troubleshooting

### Build Fails with Route Conflict

1. Run: `npm run check:routes`
2. Fix conflicts shown in output
3. Read [ROUTE_STRUCTURE_GUIDE.md](./ROUTE_STRUCTURE_GUIDE.md)

### Git Hook Not Running

```bash
# Reinstall hooks
./scripts/setup-git-hooks.sh

# Verify hook exists
ls -la .git/hooks/pre-commit
```

### Check Not Catching Issues

```bash
# Update scripts
git pull origin dev

# Reinstall
npm install
```

## 🤝 Contributing

1. Create feature branch from `dev`
2. Make changes
3. Run checks: `npm run check:routes && npm run check:naming`
4. Commit (hooks will run automatically)
5. Push and create PR

## 📞 Support

- Check documentation files in project root
- Review error messages carefully
- Ask team lead if stuck

---

**Remember:** The automated checks are there to help you catch issues early. Don't skip them!
