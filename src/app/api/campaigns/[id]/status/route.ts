// app/api/campaigns/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

// PATCH /api/campaigns/[id]/status - เปลี่ยน status ของ campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: {
            id: true,
            ownerId: true
          }
        },
        jobs: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะเจ้าของร้าน
    if (campaign.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Business logic checks
    const currentStatus = campaign.status;

    // DRAFT → ACTIVE: ต้องมีข้อมูลครบ
    if (currentStatus === 'DRAFT' && status === 'ACTIVE') {
      if (!campaign.title || !campaign.startDate || !campaign.endDate || !campaign.targetReviewers) {
        return NextResponse.json(
          { error: 'Campaign must have title, dates, and target reviewers before activating' },
          { status: 400 }
        );
      }

      // ต้องมี budget เหลือ
      if (campaign.remainingBudget <= 0) {
        return NextResponse.json(
          { error: 'Campaign must have remaining budget to activate' },
          { status: 400 }
        );
      }

      // วันเริ่มต้นต้องไม่ผ่านไปแล้ว
      const now = new Date();
      if (campaign.startDate < now) {
        return NextResponse.json(
          { error: 'Cannot activate campaign with past start date' },
          { status: 400 }
        );
      }
    }

    // ACTIVE → PAUSED: อนุญาต
    // PAUSED → ACTIVE: ต้องเช็คว่าวันที่ยังไม่หมดอายุ
    if (currentStatus === 'PAUSED' && status === 'ACTIVE') {
      const now = new Date();
      if (campaign.endDate < now) {
        return NextResponse.json(
          { error: 'Cannot reactivate campaign that has ended' },
          { status: 400 }
        );
      }
    }

    // ACTIVE/PAUSED → CANCELLED: ต้องจัดการ jobs ที่ยังไม่เสร็จ
    if ((currentStatus === 'ACTIVE' || currentStatus === 'PAUSED') && status === 'CANCELLED') {
      const activeJobs = campaign.jobs.filter(
        job => job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS'
      );

      if (activeJobs.length > 0) {
        // TODO: ควรมี confirmation จาก frontend ก่อน
        // หรืออาจจะไม่ให้ cancel ถ้ามี active jobs
        return NextResponse.json(
          {
            error: 'Cannot cancel campaign with active jobs. Please reject or complete them first.',
            activeJobsCount: activeJobs.length
          },
          { status: 400 }
        );
      }
    }

    // COMPLETED: ต้องเช็คว่า jobs เสร็จหมดแล้ว
    if (status === 'COMPLETED') {
      const incompleteJobs = campaign.jobs.filter(
        job => job.status !== 'COMPLETED' && job.status !== 'REJECTED' && job.status !== 'CANCELLED'
      );

      if (incompleteJobs.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot complete campaign with incomplete jobs',
            incompleteJobsCount: incompleteJobs.length
          },
          { status: 400 }
        );
      }
    }

    // Update status
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        jobs: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      message: `Campaign status updated to ${status}`,
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign status' },
      { status: 500 }
    );
  }
}
