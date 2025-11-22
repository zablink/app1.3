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
          const [owner, categories, tokenWallet, subscription] = await Promise.all([
            shop.ownerId ? prisma.user.findUnique({
              where: { id: shop.ownerId },
              select: { id: true, name: true, email: true },
            }) : null,
            // Get categories via junction table
            prisma.shopCategoryMapping.findMany({
              where: { shopId: shop.id },
              include: {
                category: {
                  select: { id: true, name: true, slug: true, icon: true },
                },
              },
            }).then(mappings => mappings.map(m => m.category)),
            // Get token wallet balance
            prisma.$queryRawUnsafe<any[]>(`
              SELECT balance FROM token_wallets WHERE shop_id = '${shop.id}' LIMIT 1;
            `).then(rows => rows[0] || { balance: 0 }).catch(() => ({ balance: 0 })),
            // Get active subscription with package
            prisma.$queryRawUnsafe<any[]>(`
              SELECT ss.id, ss.package_id, ss.start_date, ss.end_date, ss.status,
                     sp.name as package_name
              FROM shop_subscriptions ss
              LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
              WHERE ss.shop_id = '${shop.id}' AND ss.status = 'ACTIVE'
              ORDER BY ss.created_at DESC
              LIMIT 1;
            `).then(rows => rows[0] ? {
              id: rows[0].id,
              packageId: rows[0].package_id,
              status: rows[0].status,
              startDate: rows[0].start_date,
              endDate: rows[0].end_date,
              package: { name: rows[0].package_name },
            } : null).catch(() => null),
          ]);

          return {
            ...shop,
            owner,
            categories,
            tokenWallet,
            subscription,
          };
        } catch (e) {
          console.error('Error fetching shop data for', shop.id, e);
          return {
            ...shop,
            owner: null,
            categories: [],
            tokenWallet: { balance: 0 },
            subscription: null,
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
