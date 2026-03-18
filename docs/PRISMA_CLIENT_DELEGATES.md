# Prisma client — ชื่อ delegate ต้องตรง schema

โมเดลใน `schema.prisma` ที่ชื่อเป็น **snake_case / พหูพจน์** จะได้ client เป็น `prisma.<ชื่อโมเดล>` เช่น

| Model ใน schema   | ใช้ในโค้ด              | ❌ อย่าใช้           |
|-------------------|-------------------------|----------------------|
| `creators`        | `prisma.creators`       | `prisma.creator`     |
| `campaigns`       | `prisma.campaigns`      | `prisma.campaign`    |
| `campaign_jobs`   | `prisma.campaign_jobs`  | `prisma.campaignJob` |

โมเดลแบบ PascalCase เช่น `Shop`, `User` ยังใช้ `prisma.shop`, `prisma.user` ตามเดิม

รันตรวจทั้งโปรเจกต์ก่อน push:

```bash
npm run typecheck
```
