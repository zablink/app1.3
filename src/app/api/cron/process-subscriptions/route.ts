import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const expiredSubs = await tx.shopSubscription.findMany({
        where: {
          status: 'ACTIVE',
          end_date: {
            lt: now,
          },
        },
      });

      for (const sub of expiredSubs) {
        await tx.shopSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
      }
    });

    return NextResponse.json({ message: 'Subscriptions processed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process subscriptions' }, { status: 500 });
  }
}
