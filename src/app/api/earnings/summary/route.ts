
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  try {
    const earnings = await prisma.earning.findMany({
      where: {
        creatorId: creator.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        job: {
          select: {
            id: true,
            campaign: {
              select: {
                id: true,
                title: true,
                Shop: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        withdrawal: {
          select: {
            id: true,
            status: true,
          }
        }
      }
    });

    const total = await prisma.earning.aggregate({
      where: { creatorId: creator.id },
      _sum: { amount: true },
    });

    const totalWithdrawn = await prisma.withdrawal.aggregate({
      where: { 
        creatorId: creator.id,
        status: { in: ['PROCESSING', 'COMPLETED'] }
      },
      _sum: { amount: true },
    });
    
    const availableBalance = (total._sum.amount || 0) - (totalWithdrawn._sum.amount || 0);

    return NextResponse.json({ 
      earnings,
      summary: {
        totalEarnings: total._sum.amount || 0,
        totalWithdrawn: totalWithdrawn._sum.amount || 0,
        availableBalance,
      }
    });

  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
