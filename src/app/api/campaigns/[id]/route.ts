// app/api/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// GET /api/campaigns/[id] - ดึงข้อมูล campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: (await params).id },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            image: true,
            ownerId: true
          }
        },
        campaign_jobs: {
          include: {
            creators: {
              select: {
                id: true,
                displayName: true,
                userId: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะเจ้าของร้าน, creator ที่เกี่ยวข้อง, หรือ admin
    const isOwner = campaign.Shop.ownerId === session.user.id;
    const isCreatorInJob = campaign.campaign_jobs.some(job => job.creators.userId === session.user.id);
    const isAdmin = (session.user as any).role === 'ADMIN';

    if (!isOwner && !isCreatorInJob && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns/[id] - แก้ไข campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: (await params).id },
      include: {
        Shop: {
          select: { ownerId: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ - เฉพาะเจ้าของร้าน
    if (campaign.Shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ไม่ให้แก้ไขถ้า campaign ไม่ใช่ DRAFT
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot edit campaign that is not in DRAFT status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, targetReviewers, startDate, endDate } = body;

    // Validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const updatedCampaign = await prisma.campaigns.update({
      where: { id: (await params).id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(targetReviewers && { targetReviewers: parseInt(targetReviewers) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        updatedAt: new Date()
      },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        campaign_jobs: {
          include: {
            creators: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - ลบ campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: (await params).id },
      include: {
        Shop: {
          select: { ownerId: true }
        },
        campaign_jobs: {
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

    // ตรวจสอบสิทธิ์
    if (campaign.Shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ไม่ให้ลบถ้ามี job ที่ IN_PROGRESS หรือ COMPLETED
    const hasActiveJobs = campaign.campaign_jobs.some(
      job => job.status === 'IN_PROGRESS' || job.status === 'COMPLETED'
    );

    if (hasActiveJobs) {
      return NextResponse.json(
        { error: 'Cannot delete campaign with active or completed jobs' },
        { status: 400 }
      );
    }

    // ลบ campaign (จะลบ jobs ที่เกี่ยวข้องด้วยเพราะมี onDelete: Cascade)
    await prisma.campaigns.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
