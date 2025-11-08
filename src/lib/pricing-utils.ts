// lib/pricing-utils.ts
// Utility functions สำหรับจัดการราคาและ price history

import prisma from "@/lib/prisma";

/**
 * ดึงราคาของ creator ณ เวลาใดๆ
 * สำคัญสำหรับการคำนวนย้อนหลัง
 */
export async function getCreatorPriceAtDate(
  creatorId: string,
  date: Date
): Promise<{ priceMin: number; priceMax: number } | null> {
  const priceHistory = await prisma.creatorPriceHistory.findFirst({
    where: {
      creatorId,
      effectiveFrom: { lte: date },
      OR: [
        { effectiveTo: null }, // ยังใช้อยู่
        { effectiveTo: { gte: date } }, // หมดอายุหลังวันที่ต้องการ
      ],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!priceHistory) {
    // Fallback to current price if no history found
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { currentPriceMin: true, currentPriceMax: true },
    });

    if (!creator?.currentPriceMin || !creator?.currentPriceMax) {
      return null;
    }

    return {
      priceMin: creator.currentPriceMin,
      priceMax: creator.currentPriceMax,
    };
  }

  return {
    priceMin: priceHistory.priceMin,
    priceMax: priceHistory.priceMax,
  };
}

/**
 * ดึงราคาปัจจุบัน (active price)
 */
export async function getCurrentCreatorPrice(creatorId: string) {
  const priceHistory = await prisma.creatorPriceHistory.findFirst({
    where: {
      creatorId,
      effectiveTo: null, // ยังใช้อยู่
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!priceHistory) {
    // Fallback
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { currentPriceMin: true, currentPriceMax: true },
    });

    return creator;
  }

  return {
    priceMin: priceHistory.priceMin,
    priceMax: priceHistory.priceMax,
  };
}

/**
 * คำนวนรายได้รวมโดยใช้ agreedPrice (LOCKED price)
 */
export async function calculateTotalEarnings(
  creatorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const where: any = {
    creatorId,
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.completedAt = {};
    if (startDate) where.completedAt.gte = startDate;
    if (endDate) where.completedAt.lte = endDate;
  }

  const result = await prisma.campaignJob.aggregate({
    where,
    _sum: {
      agreedPrice: true, // ใช้ agreedPrice ไม่ใช่ currentPrice
    },
  });

  return result._sum.agreedPrice || 0;
}

/**
 * ดึงรายการงานทั้งหมดพร้อมราคาที่ตกลง
 */
export async function getJobsWithAgreedPrices(
  creatorId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
) {
  const where: any = { creatorId };

  if (options?.startDate || options?.endDate) {
    where.completedAt = {};
    if (options.startDate) where.completedAt.gte = options.startDate;
    if (options.endDate) where.completedAt.lte = options.endDate;
  }

  if (options?.status) {
    where.status = options.status;
  }

  return await prisma.campaignJob.findMany({
    where,
    include: {
      campaign: {
        select: {
          title: true,
          shop: {
            select: {
              name: true,
            },
          },
        },
      },
      creator: {
        select: {
          displayName: true,
          currentPriceMin: true,
          currentPriceMax: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });
}

/**
 * เปรียบเทียบราคาตอนจ้างกับราคาปัจจุบัน
 * แสดงว่าราคาเพิ่มขึ้นหรือลดลงเท่าไร
 */
export async function comparePriceChange(jobId: string) {
  const job = await prisma.campaignJob.findUnique({
    where: { id: jobId },
    include: {
      creator: {
        select: {
          currentPriceMin: true,
          currentPriceMax: true,
        },
      },
    },
  });

  if (!job) return null;

  const agreedPrice = job.agreedPrice;
  const currentPriceMax = job.creator.currentPriceMax || 0;

  const difference = currentPriceMax - agreedPrice;
  const percentChange = (difference / agreedPrice) * 100;

  return {
    agreedPrice,
    currentPrice: currentPriceMax,
    difference,
    percentChange: Math.round(percentChange * 100) / 100,
    isPriceIncreased: difference > 0,
  };
}

/**
 * สร้าง price history record เมื่อ admin เปลี่ยนราคา
 * (สำหรับใช้ใน API)
 */
export async function createPriceHistory(
  creatorId: string,
  newPriceMin: number,
  newPriceMax: number,
  changedBy: string,
  reason?: string
) {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Close current active price
    await tx.creatorPriceHistory.updateMany({
      where: {
        creatorId,
        effectiveTo: null,
      },
      data: {
        effectiveTo: now,
      },
    });

    // 2. Create new price history
    const newHistory = await tx.creatorPriceHistory.create({
      data: {
        creatorId,
        priceMin: newPriceMin,
        priceMax: newPriceMax,
        effectiveFrom: now,
        effectiveTo: null,
        changedBy,
        reason: reason || "Price updated by admin",
      },
    });

    // 3. Update creator current price
    await tx.creator.update({
      where: { id: creatorId },
      data: {
        currentPriceMin: newPriceMin,
        currentPriceMax: newPriceMax,
      },
    });

    return newHistory;
  });
}

/**
 * ดึง price history ทั้งหมดของ creator
 */
export async function getCreatorPriceHistory(creatorId: string) {
  return await prisma.creatorPriceHistory.findMany({
    where: { creatorId },
    orderBy: { effectiveFrom: "desc" },
  });
}

/**
 * คำนวนภาษีตามกฎหมายไทย (simplified)
 * หมายเหตุ: นี่คือการคำนวนแบบง่าย จริงๆ ต้องมี allowances, deductions ฯลฯ
 */
export function calculateThaiTax(annualIncome: number): {
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  breakdown: Array<{ bracket: string; taxableAmount: number; tax: number }>;
} {
  const taxBrackets = [
    { limit: 150000, rate: 0, label: "0-150K (0%)" },
    { limit: 300000, rate: 0.05, label: "150K-300K (5%)" },
    { limit: 500000, rate: 0.1, label: "300K-500K (10%)" },
    { limit: 750000, rate: 0.15, label: "500K-750K (15%)" },
    { limit: 1000000, rate: 0.2, label: "750K-1M (20%)" },
    { limit: 2000000, rate: 0.25, label: "1M-2M (25%)" },
    { limit: 5000000, rate: 0.3, label: "2M-5M (30%)" },
    { limit: Infinity, rate: 0.35, label: "5M+ (35%)" },
  ];

  let remainingIncome = annualIncome;
  let totalTax = 0;
  const breakdown: Array<{
    bracket: string;
    taxableAmount: number;
    tax: number;
  }> = [];

  for (const bracket of taxBrackets) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.limit);
    const tax = taxableInBracket * bracket.rate;

    breakdown.push({
      bracket: bracket.label,
      taxableAmount: taxableInBracket,
      tax,
    });

    totalTax += tax;
    remainingIncome -= taxableInBracket;
  }

  const netIncome = annualIncome - totalTax;
  const effectiveRate = (totalTax / annualIncome) * 100;

  return {
    totalTax: Math.round(totalTax),
    netIncome: Math.round(netIncome),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}

/**
 * Export types
 */
export interface PriceAtDate {
  priceMin: number;
  priceMax: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface JobWithPricing {
  id: string;
  agreedPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}
