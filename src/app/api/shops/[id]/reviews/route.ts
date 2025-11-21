// src/app/api/shops/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Get reviews for this shop
    const reviews = await prisma.shopReview.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userName: true,
        rating: true,
        comment: true,
        createdAt: true
      }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews: reviews.map(review => ({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString().split('T')[0]
      })),
      averageRating,
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST new review (for future use)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;
    const body = await request.json();
    const { userName, rating, comment } = body;

    if (!userName || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const review = await prisma.shopReview.create({
      data: {
        shopId,
        userName,
        rating,
        comment
      }
    });

    return NextResponse.json({
      id: review.id,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
