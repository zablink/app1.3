// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// ใช้ globalThis (modern approach) แทน global
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// สร้าง PrismaClient instance แบบ singleton
// ใช้ ?? (nullish coalescing) แทน || เพื่อความถูกต้อง
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: 
      process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] // dev: แสดงทุกอย่าง (เพิ่ม 'query' เพื่อ debug)
        : ['error'],                  // prod: แสดงแค่ error
  });

// Cache instance ใน development เพื่อป้องกัน hot reload สร้าง instance ใหม่
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Disconnect เมื่อ process terminate (สำคัญสำหรับ production)
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Export เป็น default ด้วยเพื่อรองรับทั้ง 2 style
export default prisma;