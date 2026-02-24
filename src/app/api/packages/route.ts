
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const packages = await prisma.subscriptionPackage.findMany();
  return NextResponse.json(packages);
}
