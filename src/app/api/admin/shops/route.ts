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
          isMockup: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);

    console.log('Shops found:', shops.length, 'Total:', total);

    // Fetch all related data in bulk to avoid connection pool exhaustion
    const shopIds = shops.map(s => s.id);
    const ownerIds = shops.map(s => s.ownerId).filter(Boolean) as string[];

    console.log('Fetching related data for', shopIds.length, 'shops');

    // Batch fetch all data
    const [ownersData, categoriesData, walletsData, subscriptionsData] = await Promise.all([
      // Get all owners in one query
      ownerIds.length > 0 
        ? prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, name: true, email: true },
          })
        : [],
      // Get all categories in one query
      prisma.shopCategoryMapping.findMany({
        where: { shopId: { in: shopIds } },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      }),
      // Get all token wallets - use parameterized query
      shopIds.length > 0
        ? prisma.$queryRawUnsafe<any[]>(
            `SELECT shop_id, balance FROM token_wallets WHERE shop_id = ANY($1::text[])`,
            shopIds
          ).catch(err => {
            console.error('Error fetching wallets:', err);
            return [];
          })
        : [],
      // Get all active subscriptions - use parameterized query
      shopIds.length > 0
        ? prisma.$queryRawUnsafe<any[]>(
            `SELECT ss.shop_id, ss.id, ss.package_id, ss.start_date, ss.end_date, ss.status,
                    sp.name as package_name, sp.tier as package_tier
             FROM shop_subscriptions ss
             LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
             WHERE ss.shop_id = ANY($1::text[]) AND ss.status = 'ACTIVE'
             ORDER BY ss.created_at DESC`,
            shopIds
          ).catch(err => {
            console.error('Error fetching subscriptions:', err);
            return [];
          })
        : [],
    ]);

    console.log('Fetched:', {
      owners: ownersData.length,
      categories: categoriesData.length,
      wallets: walletsData.length,
      subscriptions: subscriptionsData.length
    });

    // Debug: log sample data
    if (walletsData.length > 0) {
      console.log('Sample wallet:', walletsData[0]);
    }
    if (subscriptionsData.length > 0) {
      console.log('Sample subscription:', subscriptionsData[0]);
    }

    // Create lookup maps for O(1) access
    const ownersMap = new Map(ownersData.map(o => [o.id, o]));
    const categoriesMap = new Map<string, any[]>();
    categoriesData.forEach(mapping => {
      if (!categoriesMap.has(mapping.shopId)) {
        categoriesMap.set(mapping.shopId, []);
      }
      categoriesMap.get(mapping.shopId)!.push(mapping.category);
    });
    const walletsMap = new Map(walletsData.map((w: any) => [w.shop_id, { balance: parseInt(w.balance) || 0 }]));
    const subscriptionsMap = new Map<string, any>();
    subscriptionsData.forEach((sub: any) => {
      // Only keep the first (most recent) subscription per shop
      if (!subscriptionsMap.has(sub.shop_id)) {
        subscriptionsMap.set(sub.shop_id, {
          id: sub.id,
          packageId: sub.package_id,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          package: { 
            name: sub.package_name,
            tier: sub.package_tier 
          },
        });
      }
    });

    console.log('Maps created:', {
      walletsMapSize: walletsMap.size,
      subscriptionsMapSize: subscriptionsMap.size
    });

    // Map shops with their related data
    const shopsWithData = shops.map(shop => ({
      ...shop,
      owner: shop.ownerId ? ownersMap.get(shop.ownerId) || null : null,
      categories: categoriesMap.get(shop.id) || [],
      tokenWallet: walletsMap.get(shop.id) || { balance: 0 },
      subscription: subscriptionsMap.get(shop.id) || null,
    }));

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
