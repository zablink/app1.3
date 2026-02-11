// app/api/campaign-jobs/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// POST /api/campaign-jobs/[id]/reject - Shop ปฏิเสธงาน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for rejection' },
        { status: 400 }
      );
    }

    const job = await prisma.campaignJob.findUnique({
      where: { id: (await params).id },
      include: {
        creator: {
          select: {
            id: true,
            userId: true
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
        { error: 'Can only reject jobs that are SUBMITTED' },
        { status: 400 }
      );
    }

    // Update job status เป็น REJECTED และคืน budget
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update job status
      const updatedJob = await tx.campaignJob.update({
        where: { id: (await params).id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          reviewNotes: reason // เก็บเหตุผลใน reviewNotes
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

      // 2. คืน budget กลับไปให้ campaign (เพราะงานถูกปฏิเสธ)
      await tx.campaign.update({
        where: { id: job.campaignId },
        data: {
          remainingBudget: {
            increment: job.agreedPrice
          }
        }
      });

      return { job: updatedJob };
    });

    return NextResponse.json({
      message: 'Job rejected. Budget returned to campaign.',
      job: result.job,
      returnedBudget: job.agreedPrice,
      reason
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    return NextResponse.json(
      { error: 'Failed to reject job' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaign-jobs/[id]/reject - Creator ยกเลิกงาน (ถอนตัว)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    const job = await prisma.campaignJob.findUnique({
      where: { id: (await params).id },
      include: {
        creator: {
          select: {
            id: true,
            userId: true
          }
        },
        campaign: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะ creator เจ้าของงาน
    if (job.creator.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ตรวจสอบ status - creator สามารถยกเลิกได้เฉพาะ PENDING หรือ ACCEPTED
    if (job.status !== 'PENDING' && job.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Can only cancel jobs that are PENDING or ACCEPTED' },
        { status: 400 }
      );
    }

    // Update job status เป็น CANCELLED
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update job status
      const updatedJob = await tx.campaignJob.update({
        where: { id: (await params).id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          reviewNotes: reason || 'Cancelled by creator'
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true,
              shop: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // 2. ถ้า job เป็น ACCEPTED แล้ว ต้องคืน budget
      if (job.status === 'ACCEPTED') {
        await tx.campaign.update({
          where: { id: job.campaignId },
          data: {
            remainingBudget: {
              increment: job.agreedPrice
            }
          }
        });
      }

      return { job: updatedJob, budgetReturned: job.status === 'ACCEPTED' };
    });

    return NextResponse.json({
      message: 'Job cancelled successfully',
      job: result.job,
      ...(result.budgetReturned && { 
        budgetReturned: job.agreedPrice,
        note: 'Budget returned to campaign'
      })
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
