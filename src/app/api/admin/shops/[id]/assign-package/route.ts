import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { packageId, tokenAmount, subscriptionDays } = await request.json();
    const shopId = params.id;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    // Check if package exists
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const days = parseInt(subscriptionDays as string) || pkg.periodDays;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const tokens = parseInt(tokenAmount as string) || pkg.tokenAmount || 0;

    // Create subscription
    const subscription = await prisma.shopSubscription.create({
      data: {
        shopId: shopId,
        planId: packageId,
        status: 'ACTIVE',
        startedAt: now,
        expiresAt: expiresAt,
        autoRenew: false,
        paymentProvider: 'ADMIN_GRANT',
        paymentRef: `ADMIN_${Date.now()}`,
      },
    });

    // Add tokens if specified
    if (tokens > 0) {
      // Get or create token wallet
      let wallet = await prisma.tokenWallet.findUnique({
        where: { shopId: shopId },
      });

      if (!wallet) {
        wallet = await prisma.tokenWallet.create({
          data: {
            shopId: shopId,
            balance: 0,
          },
        });
      }

      // Create token purchase record
      const tokenPurchase = await prisma.tokenPurchase.create({
        data: {
          walletId: wallet.id,
          amount: tokens,
          remaining: tokens,
          price: 0, // Admin grant = free
          provider: 'ADMIN_GRANT',
          providerRef: `ADMIN_${Date.now()}`,
          createdAt: now,
          expiresAt: expiresAt,
        },
      });

      // Update wallet balance
      await prisma.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: tokens,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Package and tokens assigned successfully',
    });
  } catch (err) {
    console.error('Assign package error:', err);
    return NextResponse.json(
      { error: 'Failed to assign package' },
      { status: 500 }
    );
  }
}
