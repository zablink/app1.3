import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      where.status = status;
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ShopCategory: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);

    return NextResponse.json({
      shops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Fetch shops error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}
