import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) {
    console.log('Admin check failed');
    return error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Fetching shops - page:', page, 'limit:', limit, 'status:', status);

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      where.status = status;
    }

    // Simple query first - just get shops without relations
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          ownerId: true,
          categoryId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);

    console.log('Shops found:', shops.length, 'Total:', total);

    // Now fetch related data separately
    const shopsWithData = await Promise.all(
      shops.map(async (shop) => {
        try {
          const [owner, category] = await Promise.all([
            shop.ownerId ? prisma.user.findUnique({
              where: { id: shop.ownerId },
              select: { id: true, name: true, email: true },
            }) : null,
            shop.categoryId ? prisma.shopCategory.findUnique({
              where: { id: shop.categoryId },
              select: { id: true, name: true },
            }) : null,
          ]);

          return {
            ...shop,
            owner,
            category,
            tokenWallet: { balance: 0 }, // Default value since table doesn't exist yet
          };
        } catch (e) {
          console.error('Error fetching shop data for', shop.id, e);
          return {
            ...shop,
            owner: null,
            category: null,
            tokenWallet: { balance: 0 },
          };
        }
      })
    );

    return NextResponse.json({
      shops: shopsWithData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Fetch shops error:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to fetch shops', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
