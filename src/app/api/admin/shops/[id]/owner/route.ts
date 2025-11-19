// /src/app/api/admin/shops/[id]/owner/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const shopId = params.id;
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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const shopId = params.id;
  const authErr = await requireOwnerOrAdmin(req, shopId);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { planId, autoRenew = false, paymentProvider, paymentRef } = body;
    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    const plan = await prisma.subscriptionPackage.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);

    const sub = await prisma.shopSubscription.create({
      data: {
        shop: { connect: { id: shopId } },
        plan: { connect: { id: planId } },
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
          data: { balance: wallet.balance + plan.tokenAmount },
        });
      }

      await prisma.tokenPurchase.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          amount: plan.tokenAmount,
          remaining: plan.tokenAmount,
          price: plan.price,
          provider: paymentProvider ?? "subscription",
          providerRef: paymentRef ?? null,
          expiresAt,
        },
      });
    }

    return NextResponse.json(sub);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const shopId = params.id;
  const authErr = await requireOwnerOrAdmin(req, shopId);
  if (authErr) return authErr;

  try {
    const active = await prisma.shopSubscription.findFirst({
      where: { shopId, status: "ACTIVE" },
      orderBy: { expiresAt: "desc" },
    });
    if (!active) return NextResponse.json({ error: "No active subscription" }, { status: 404 });

    const updated = await prisma.shopSubscription.update({
      where: { id: active.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}