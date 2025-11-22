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

    console.log('Assign package request:', { shopId, packageId, tokenAmount, subscriptionDays });

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    // Check if package exists using raw query
    const pkgResult = await prisma.$queryRawUnsafe<Array<any>>(`
      SELECT id, name, 
        COALESCE(price, price_monthly, 0) as price,
        COALESCE(period_days, 30) as period_days,
        token_amount
      FROM subscription_packages 
      WHERE id = '${packageId}';
    `);

    if (pkgResult.length === 0) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const pkg = pkgResult[0];

    // Check if shop exists
    const shopResult = await prisma.$queryRawUnsafe<Array<any>>(`
      SELECT id FROM "Shop" WHERE id = '${shopId}';
    `);

    if (shopResult.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const days = parseInt(subscriptionDays as string) || pkg.period_days || 30;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const tokens = parseInt(tokenAmount as string) || pkg.token_amount || 0;

    // Create subscription using raw SQL
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    const price = parseFloat(pkg.price) || 0;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO shop_subscriptions 
        (id, shop_id, package_id, status, start_date, end_date, original_price, final_price, payment_status, auto_renew, created_at, updated_at)
      VALUES 
        (
          '${subscriptionId}', 
          '${shopId}', 
          '${packageId}', 
          'ACTIVE', 
          DATE '${now.toISOString().split('T')[0]}', 
          DATE '${expiresAt.toISOString().split('T')[0]}', 
          ${price},
          ${price},
          'COMPLETED', 
          false, 
          TIMESTAMP '${now.toISOString()}', 
          TIMESTAMP '${now.toISOString()}'
        );
    `);

    console.log('✅ Subscription created:', subscriptionId);

    // Update or create token wallet
    let tokenMessage = '';
    let newWalletBalance = 0;
    if (tokens > 0) {
      try {
        // Check if wallet exists
        const walletExists = await prisma.$queryRawUnsafe<any[]>(`
          SELECT id, balance FROM token_wallets WHERE shop_id = '${shopId}';
        `);

        if (walletExists.length > 0) {
          // Update existing wallet
          const currentBalance = parseInt(walletExists[0].balance) || 0;
          newWalletBalance = currentBalance + tokens;
          await prisma.$executeRawUnsafe(`
            UPDATE token_wallets 
            SET balance = ${newWalletBalance}, updated_at = NOW()
            WHERE shop_id = '${shopId}';
          `);
          tokenMessage = ` และเพิ่ม ${tokens} tokens (ยอดรวม: ${newWalletBalance})`;
          console.log('✅ Updated wallet:', { shopId, oldBalance: currentBalance, newBalance: newWalletBalance });
        } else {
          // Create new wallet
          newWalletBalance = tokens;
          await prisma.$executeRawUnsafe(`
            INSERT INTO token_wallets (shop_id, balance, created_at, updated_at)
            VALUES ('${shopId}', ${newWalletBalance}, NOW(), NOW());
          `);
          tokenMessage = ` และเพิ่ม ${tokens} tokens`;
          console.log('✅ Created wallet:', { shopId, balance: newWalletBalance });
        }
      } catch (walletError) {
        console.error('Token wallet error:', walletError);
        tokenMessage = ` (ไม่สามารถเพิ่ม tokens ได้: ${walletError instanceof Error ? walletError.message : String(walletError)})`;
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        shopId,
        packageId,
        status: 'ACTIVE',
        expiresAt,
      },
      tokenWallet: {
        balance: newWalletBalance,
      },
      message: `มอบหมาย package สำเร็จ${tokenMessage}`,
    });
  } catch (err) {
    console.error('Assign package error:', err);
    return NextResponse.json(
      { error: 'Failed to assign package', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
