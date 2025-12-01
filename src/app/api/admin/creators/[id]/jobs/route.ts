import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /admin/creators/[id]/jobs
 * ดึงรายการงานที่ Creator นี้รับ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { creatorId: (await params).id };
    if (status) {
      where.status = status;
    }

    const [jobs, total, stats] = await Promise.all([
      prisma.campaign_jobs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          campaigns: {
            include: {
              Shop: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign_jobs.count({ where }),
      // สถิติของงาน
      prisma.campaign_jobs.groupBy({
        by: ['status'],
        where: { creatorId: (await params).id },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.status || 'UNKNOWN'] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (err) {
    console.error('Fetch creator jobs error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch creator jobs' },
      { status: 500 }
    );
  }
}
