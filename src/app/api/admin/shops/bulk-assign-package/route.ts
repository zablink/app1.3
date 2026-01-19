// src/app/api/admin/shops/bulk-assign-package/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopIds, packageId, tokenAmount, subscriptionDays } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json({ error: 'Shop IDs are required' }, { status: 400 });
    }

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const results = await Promise.all(shopIds.map(async (shopId) => {
      try {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          include: { tokenWallet: true }
        });

        if (!shop) {
          return { shopId, success: false, error: 'Shop not found' };
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (subscriptionDays || 30));

        // สร้างหรืออัปเดต subscription
        await prisma.shopSubscription.upsert({
          where: {
            shop_id_package_id_status: {
              shop_id: shopId,
              package_id: packageId,
              status: 'ACTIVE'
            }
          },
          create: {
            shop_id: shopId,
            package_id: packageId,
            start_date: startDate,
            end_date: endDate,
            status: 'ACTIVE',
            payment_status: 'PAID',
            original_price: 0,
            final_price: 0,
            paid_at: new Date()
          },
          update: {
            end_date: endDate,
            updated_at: new Date()
          }
        });

        // สร้างหรืออัปเดต token wallet
        if (tokenAmount && tokenAmount > 0) {
          await prisma.tokenWallet.upsert({
            where: { shop_id: shopId },
            create: {
              shop_id: shopId,
              balance: tokenAmount
            },
            update: {
              balance: { increment: tokenAmount }
            }
          });
        }

        return { shopId, success: true };
      } catch (error) {
        console.error(`Error assigning package to shop ${shopId}:`, error);
        return { shopId, success: false, error: 'Failed to assign package' };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `มอบหมาย Package สำเร็จ ${successCount} ร้าน${failedCount > 0 ? `, ล้มเหลว ${failedCount} ร้าน` : ''}`,
      results,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error('Bulk assign package error:', error);
    return NextResponse.json(
      { error: 'Failed to assign packages' },
      { status: 500 }
    );
  }
}
