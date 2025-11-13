// app/api/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/campaigns/[id] - ดึงข้อมูล campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            ownerId: true
          }
        },
        jobs: {
          include: {
            creator: {
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
    const isOwner = campaign.shop.ownerId === session.user.id;
    const isCreatorInJob = campaign.jobs.some(job => job.creator.userId === session.user.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: { ownerId: true }
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

    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(targetReviewers && { targetReviewers: parseInt(targetReviewers) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        shop: {
          select: { ownerId: true }
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

    // ตรวจสอบสิทธิ์
    if (campaign.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ไม่ให้ลบถ้ามี job ที่ IN_PROGRESS หรือ COMPLETED
    const hasActiveJobs = campaign.jobs.some(
      job => job.status === 'IN_PROGRESS' || job.status === 'COMPLETED'
    );

    if (hasActiveJobs) {
      return NextResponse.json(
        { error: 'Cannot delete campaign with active or completed jobs' },
        { status: 400 }
      );
    }

    // ลบ campaign (จะลบ jobs ที่เกี่ยวข้องด้วยเพราะมี onDelete: Cascade)
    await prisma.campaign.delete({
      where: { id: params.id }
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
