// app/api/campaign-jobs/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

// Platform commission rate (10%)
const PLATFORM_COMMISSION_RATE = 0.10;
// Token to Baht conversion (1 token = 1 baht)
const TOKEN_TO_BAHT = 1;

// POST /api/campaign-jobs/[id]/complete - Shop อนุมัติงาน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.campaignJob.findUnique({
      where: { id: (await params).id },
      include: {
        creator: {
          select: {
            id: true,
            userId: true,
            totalReviews: true,
            completedReviews: true
          }
        },
        campaign: {
          include: {
            shop: {
              select: {
                id: true,
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะเจ้าของร้าน
    if (job.campaign.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ตรวจสอบ status ของ job - ต้องเป็น SUBMITTED
    if (job.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Job must be SUBMITTED to complete' },
        { status: 400 }
      );
    }

    // คำนวณค่าคอมมิชชั่นและรายได้
    const agreedPriceInBaht = job.agreedPrice * TOKEN_TO_BAHT;
    const platformCommission = Math.round(agreedPriceInBaht * PLATFORM_COMMISSION_RATE);
    const creatorEarning = agreedPriceInBaht - platformCommission;

    // Update job และสร้าง earning record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update job status เป็น COMPLETED
      const updatedJob = await tx.campaignJob.update({
        where: { id: (await params).id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          tokensPaid: job.agreedPrice,
          platformCommission,
          creatorEarning
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              phone: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  logo: true
                }
              }
            }
          }
        }
      });

      // 2. สร้าง Earning record
      const earning = await tx.earning.create({
        data: {
          creatorId: job.creatorId,
          campaignJobId: job.id,
          amount: creatorEarning,
          status: 'PENDING', // จะเป็น AVAILABLE หลังจาก review period (เช่น 7 วัน)
          earnedAt: new Date(),
          // availableAt จะถูกตั้งเป็น 7 วันหลังจากนี้
          availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // 3. Update Creator stats
      await tx.creator.update({
        where: { id: job.creatorId },
        data: {
          totalReviews: { increment: 1 },
          completedReviews: { increment: 1 },
          totalEarnings: { increment: creatorEarning }
        }
      });

      return { job: updatedJob, earning };
    });

    return NextResponse.json({
      message: 'Job completed successfully. Payment will be available after review period.',
      job: result.job,
      earning: {
        id: result.earning.id,
        amount: result.earning.amount,
        availableAt: result.earning.availableAt
      },
      financial: {
        tokensPaid: job.agreedPrice,
        agreedPriceInBaht,
        platformCommission,
        creatorEarning
      }
    });
  } catch (error) {
    console.error('Error completing job:', error);
    return NextResponse.json(
      { error: 'Failed to complete job' },
      { status: 500 }
    );
  }
}
