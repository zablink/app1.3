// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // เพิ่ม property prisma ลงบน globalThis
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

// เก็บ instance ไว้ใน globalThis (เพื่อ hot-reload dev mode)
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
