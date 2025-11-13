// app/api/campaigns/[id]/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

// GET /api/campaigns/[id]/jobs - ดึง jobs ทั้งหมดของ campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // Filter by status

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        shop: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์
    const isOwner = campaign.shop.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause: any = {
      campaignId: params.id
    };

    if (status) {
      whereClause.status = status;
    }

    const jobs = await prisma.campaignJob.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            phone: true,
            socialMedia: true,
            portfolioLinks: true,
            currentPriceMin: true,
            currentPriceMax: true,
            totalReviews: true,
            completedReviews: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      campaignId: params.id,
      total: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Error fetching campaign jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign jobs' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/jobs - สร้าง job ใหม่ (เชิญ creator)
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
    const { creatorId, agreedPrice } = body;

    if (!creatorId || !agreedPrice) {
      return NextResponse.json(
        { error: 'creatorId and agreedPrice are required' },
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
          where: {
            creatorId: creatorId
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

    // ตรวจสอบว่า campaign เป็น ACTIVE หรือไม่
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Campaign must be ACTIVE to invite creators' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า creator นี้มี job อยู่แล้วหรือไม่
    if (campaign.jobs.length > 0) {
      return NextResponse.json(
        { error: 'Creator already has a job in this campaign' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี budget เหลือพอหรือไม่
    const priceInTokens = parseInt(agreedPrice);
    if (campaign.remainingBudget < priceInTokens) {
      return NextResponse.json(
        {
          error: 'Insufficient budget',
          remainingBudget: campaign.remainingBudget,
          required: priceInTokens
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า creator มีอยู่จริงและ approved
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        applicationStatus: true,
        currentPriceMin: true,
        currentPriceMax: true
      }
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (creator.applicationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Creator is not approved' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าราคาอยู่ในช่วงที่กำหนดหรือไม่
    if (creator.currentPriceMin && creator.currentPriceMax) {
      if (priceInTokens < creator.currentPriceMin || priceInTokens > creator.currentPriceMax) {
        return NextResponse.json(
          {
            error: 'Agreed price is outside creator\'s price range',
            creatorPriceRange: {
              min: creator.currentPriceMin,
              max: creator.currentPriceMax
            }
          },
          { status: 400 }
        );
      }
    }

    // สร้าง job ใหม่
    const newJob = await prisma.campaignJob.create({
      data: {
        campaignId: params.id,
        creatorId: creatorId,
        agreedPrice: priceInTokens,
        status: 'PENDING',
        createdAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            currentPriceMin: true,
            currentPriceMax: true
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

    return NextResponse.json({
      message: 'Job created successfully',
      job: newJob
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign job:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign job' },
      { status: 500 }
    );
  }
}
