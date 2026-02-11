// src/app/api/user/update-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ['USER', 'SHOP', 'CREATOR', 'ADMIN'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update role',
      },
      { status: 500 }
    );
  }
}
