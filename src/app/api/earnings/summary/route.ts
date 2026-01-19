// app/api/creator/earnings/summary/route.ts
// คำนวนรายได้และสรุปภาษีโดยใช้ agreedPrice (LOCKED price)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Creator" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    let dateFilter: any = {};
    
    if (year) {
      const yearInt = parseInt(year);
      dateFilter = {
        gte: new Date(`${yearInt}-01-01`),
        lt: new Date(`${yearInt + 1}-01-01`),
      };
    } else if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // CRITICAL: Use agreedPrice (LOCKED price) NOT currentPrice
    const jobs = await prisma.campaignJob.findMany({
      where: {
        creatorId: creator.id,
        status: "COMPLETED",
        ...(Object.keys(dateFilter).length > 0 && {
          completedAt: dateFilter,
        }),
      },
      include: {
        campaign: {
          select: {
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Calculate summary using agreedPrice
    const totalJobs = jobs.length;
    const totalEarnings = jobs.reduce(
      (sum, job) => sum + (job.creatorEarning || job.agreedPrice),
      0
    );
    const totalTokens = jobs.reduce((sum, job) => sum + job.agreedPrice, 0);
    const totalCommission = jobs.reduce(
      (sum, job) => sum + (job.platformCommission || 0),
      0
    );

    // Group by month for detailed breakdown
    const monthlyBreakdown = jobs.reduce((acc: any, job) => {
      const month = job.completedAt
        ? new Date(job.completedAt).toISOString().substring(0, 7)
        : "unknown";

      if (!acc[month]) {
        acc[month] = {
          month,
          jobs: 0,
          earnings: 0,
          tokens: 0,
          commission: 0,
        };
      }

      acc[month].jobs += 1;
      acc[month].earnings += job.creatorEarning || job.agreedPrice;
      acc[month].tokens += job.agreedPrice; // LOCKED price
      acc[month].commission += job.platformCommission || 0;

      return acc;
    }, {});

    // Price change detection during period
    const priceHistory = await prisma.creatorPriceHistory.findMany({
      where: {
        creatorId: creator.id,
        ...(Object.keys(dateFilter).length > 0 && {
          effectiveFrom: dateFilter,
        }),
      },
      orderBy: { effectiveFrom: "desc" },
    });

    // Tax calculation (simplified - adjust based on Thai tax law)
    const taxBrackets = [
      { limit: 150000, rate: 0 },
      { limit: 300000, rate: 0.05 },
      { limit: 500000, rate: 0.1 },
      { limit: 750000, rate: 0.15 },
      { limit: 1000000, rate: 0.2 },
      { limit: 2000000, rate: 0.25 },
      { limit: 5000000, rate: 0.3 },
      { limit: Infinity, rate: 0.35 },
    ];

    let remainingIncome = totalEarnings;
    let totalTax = 0;

    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(remainingIncome, bracket.limit);
      totalTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    const netIncome = totalEarnings - totalTax;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalJobs,
          totalEarnings, // ใช้ agreedPrice (LOCKED)
          totalTokens,
          totalCommission,
          estimatedTax: Math.round(totalTax),
          netIncome: Math.round(netIncome),
        },
        monthlyBreakdown: Object.values(monthlyBreakdown),
        priceChanges: priceHistory.length,
        priceHistory: priceHistory.map((h) => ({
          effectiveFrom: h.effectiveFrom,
          effectiveTo: h.effectiveTo,
          priceMin: h.priceMin,
          priceMax: h.priceMax,
          reason: h.reason,
        })),
        jobs: jobs.map((job) => ({
          id: job.id,
          campaignTitle: job.campaign.title,
          agreedPrice: job.agreedPrice, // แสดงราคาที่ตกลง
          creatorEarning: job.creatorEarning,
          commission: job.platformCommission,
          completedAt: job.completedAt,
          paidAt: job.paidAt,
        })),
      },
      period: {
        year: year || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error calculating earnings:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

// POST - Export earnings report (PDF/CSV)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Creator" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { year, format = "csv" } = body;

    // Fetch data same as GET endpoint
    const jobs = await prisma.campaignJob.findMany({
      where: {
        creatorId: creator.id,
        status: "COMPLETED",
        completedAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
      include: {
        campaign: true,
      },
    });

    if (format === "csv") {
      // Generate CSV
      const header = "Date,Campaign,Agreed Price,Commission,Net Earning,Status\n";
      const rows = jobs
        .map(
          (job) =>
            `${job.completedAt?.toISOString().split("T")[0]},${
              job.campaign.title
            },${job.agreedPrice},${job.platformCommission || 0},${
              job.creatorEarning || job.agreedPrice
            },${job.status}`
        )
        .join("\n");

      const csv = header + rows;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="earnings-${year}.csv"`,
        },
      });
    }

    // TODO: Generate PDF format

    return NextResponse.json({
      success: true,
      message: "Export feature coming soon",
    });
  } catch (error) {
    console.error("Error exporting earnings:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
