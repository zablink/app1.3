// /src/app/api/admin/shops/[shopId]/owner/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const shopId = (await params).shopId;
    const active = await prisma.shopSubscription.findFirst({
      where: { shopId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { expiresAt: "desc" },
    });
    return NextResponse.json(active);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const shopId = (await params).shopId;
  const authErr = await requireOwnerOrAdmin(req, shopId);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { packageId, autoRenew = false, paymentProvider, paymentRef } = body;
    if (!packageId) return NextResponse.json({ error: "packageId required" }, { status: 400 });

    const plan = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);

    const sub = await prisma.shopSubscription.create({
      data: {
        shop: { connect: { id: shopId } },
        plan: { connect: { id: packageId } },
        status: "ACTIVE",
        startedAt,
        expiresAt,
        autoRenew,
        paymentProvider,
        paymentRef,
      },
      include: { plan: true },
    });

    // If plan grants tokens, grant tokens and create token purchase batch
    if (plan.tokenAmount && plan.tokenAmount > 0) {
      let wallet = await prisma.tokenWallet.findUnique({ where: { shopId } });
      if (!wallet) {
        wallet = await prisma.tokenWallet.create({
          data: { shop: { connect: { id: shopId } }, balance: plan.tokenAmount },
        });
      } else {
        await prisma.tokenWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: plan.tokenAmount } },
        });
      }
    }

    return NextResponse.json(sub);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
