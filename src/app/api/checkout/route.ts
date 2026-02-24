
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const { packageId } = await req.json();

  if (!packageId) {
    return new NextResponse('Package ID is required', { status: 400 });
  }

  const subscriptionPackage = await prisma.subscriptionPackage.findUnique({
    where: { id: packageId },
  });

  if (!subscriptionPackage) {
    return new NextResponse('Package not found', { status: 404 });
  }

  const line_items = [
    {
      price_data: {
        currency: 'thb',
        product_data: {
          name: subscriptionPackage.name,
        },
        unit_amount: subscriptionPackage.price * 100,
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${headers().get('origin')}/payment/success`,
    cancel_url: `${headers().get('origin')}/payment/cancel`,
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
