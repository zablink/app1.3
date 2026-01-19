// src/app/api/shops/[shopId]/subscription/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";
import {
  isOGEligible,
  calculateOGBenefitsUntil,
  calculateOGTokens,
  getOGTokenMultiplier,
  getOGUsageDiscount,
} from "@/lib/og-campaign";

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

    // Check if eligible for OG Campaign
    const isOG = await isOGEligible(startedAt);
    const ogBenefitsUntil = isOG ? await calculateOGBenefitsUntil(startedAt) : null;
    const ogTokenMultiplier = isOG ? await getOGTokenMultiplier() : 1.0;
    const ogUsageDiscount = isOG ? await getOGUsageDiscount() : 0.0;

    // Get shop owner for OG member status
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });

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
        // OG Campaign fields
        is_og_subscription: isOG,
        og_token_multiplier: ogTokenMultiplier,
        og_usage_discount: ogUsageDiscount,
      },
      include: { plan: true },
    });

    // Update user OG member status if eligible
    if (isOG && shop?.ownerId) {
      await prisma.user.update({
        where: { id: shop.ownerId },
        data: {
          isOGMember: true,
          ogJoinedAt: startedAt,
          ogBenefitsUntil: ogBenefitsUntil,
          ogBadgeEnabled: true,
        },
      });
    }

    // If plan grants tokens, grant tokens and create token purchase batch
    if (plan.tokenAmount && plan.tokenAmount > 0) {
      // Calculate token amount with OG multiplier
      const finalTokenAmount = await calculateOGTokens(plan.tokenAmount, isOG);

      let wallet = await prisma.tokenWallet.findUnique({ where: { shopId } });
      if (!wallet) {
        wallet = await prisma.tokenWallet.create({
          data: { shop: { connect: { id: shopId } }, balance: finalTokenAmount },
        });
      } else {
        await prisma.tokenWallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance + finalTokenAmount },
        });
      }

      await prisma.tokenPurchase.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          amount: finalTokenAmount,
          remaining: finalTokenAmount,
          price: plan.price,
          provider: paymentProvider ?? "subscription",
          providerRef: paymentRef ?? null,
          expiresAt: ogBenefitsUntil || expiresAt, // Use OG benefits until date if OG
        },
      });
    }

    return NextResponse.json({
      ...sub,
      og: {
        isOG,
        tokenMultiplier: ogTokenMultiplier,
        usageDiscount: ogUsageDiscount,
        benefitsUntil: ogBenefitsUntil,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const shopId = (await params).shopId;
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