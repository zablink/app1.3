// app/api/campaign-jobs/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/campaign-jobs/[id]/submit - Creator ส่งงานเสร็จ
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewLink, reviewNotes } = body;

    if (!reviewLink) {
      return NextResponse.json(
        { error: 'reviewLink is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(reviewLink);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid review link URL' },
        { status: 400 }
      );
    }

    const job = await prisma.campaignJob.findUnique({
      where: { id: params.id },
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

    // ตรวจสอบสิทธิ์ - เฉพาะ creator ที่รับงาน
    if (job.creator.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ตรวจสอบ status ของ job - ต้องเป็น ACCEPTED หรือ IN_PROGRESS
    if (job.status !== 'ACCEPTED' && job.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Job must be ACCEPTED or IN_PROGRESS to submit' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า campaign ยัง ACTIVE อยู่หรือไม่
    if (job.campaign.status !== 'ACTIVE' && job.campaign.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Campaign is not active or paused' },
        { status: 400 }
      );
    }

    // Update job status เป็น SUBMITTED
    const updatedJob = await prisma.campaignJob.update({
      where: { id: params.id },
      data: {
        status: 'SUBMITTED',
        reviewLink,
        reviewNotes: reviewNotes || null,
        submittedAt: new Date(),
        // ถ้ายังไม่ได้ start ให้ set startedAt ด้วย
        ...(job.status === 'ACCEPTED' && { startedAt: new Date() })
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
                logo: true,
                ownerId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Job submitted successfully. Waiting for shop approval.',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    return NextResponse.json(
      { error: 'Failed to submit job' },
      { status: 500 }
    );
  }
}
