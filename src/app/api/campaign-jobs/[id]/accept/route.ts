// app/api/campaign-jobs/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// POST /api/campaign-jobs/[id]/accept - Creator รับงาน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.campaign_jobs.findUnique({
      where: { id: (await params).id },
      include: {
        creators: {
          select: {
            id: true,
            userId: true
          }
        },
        campaigns: {
          select: {
            id: true,
            status: true,
            remainingBudget: true,
            endDate: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะ creator ที่ถูกเชิญ
    if (job.creators.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ตรวจสอบ status ของ job
    if (job.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Job is not in PENDING status' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า campaign ยัง ACTIVE อยู่หรือไม่
    if (job.campaigns.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า campaign ยังไม่หมดอายุ
    const now = new Date();
    if (job.campaigns.endDate < now) {
      return NextResponse.json(
        { error: 'Campaign has ended' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี budget เหลือพอหรือไม่
    if (job.campaigns.remainingBudget < job.agreedPrice) {
      return NextResponse.json(
        {
          error: 'Insufficient campaign budget',
          remainingBudget: job.campaigns.remainingBudget,
          required: job.agreedPrice
        },
        { status: 400 }
      );
    }

    // Update job status เป็น ACCEPTED
    const updatedJob = await prisma.$transaction(async (tx) => {
      // 1. Update job status
      const job = await tx.campaign_jobs.update({
        where: { id: (await params).id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        },
        include: {
          creators: {
            select: {
              id: true,
              displayName: true
            }
          },
          campaigns: {
            select: {
              id: true,
              title: true,
              description: true,
              Shop: {
                select: {
                  id: true,
                  name: true,
                image: true,
                  address: true,
                }
              }
            }
          }
        }
      });

      // 2. ลด remaining budget ของ campaign (reserve budget)
      await tx.campaigns.update({
        where: { id: job.campaignId },
        data: {
          remainingBudget: {
            decrement: job.agreedPrice
          }
        }
      });

      return job;
    });

    return NextResponse.json({
      message: 'Job accepted successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error accepting job:', error);
    return NextResponse.json(
      { error: 'Failed to accept job' },
      { status: 500 }
    );
  }
}
