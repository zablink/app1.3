import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: (await params).id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('Fetch user error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { role } = body;

    if (role && !['USER', 'SHOP', 'CREATOR', 'MCN_MANAGER', 'AD_MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: (await params).id },
      data: {
        role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'อัพเดทผู้ใช้เรียบร้อยแล้ว',
      data: user,
    });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
