// src/app/api/ads/purchase/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

/**
 * POST body:
 * {
 *   shopId,
 *   adPackageId?, // optional
 *   position?,
 *   scope: "SUBDISTRICT" | "DISTRICT" | "PROVINCE" | "REGION" | "NATIONWIDE",
 *   durationDays,
 *   tokenCost  // raw token cost (before discount)
 * }
 *
 * Algorithm:
 * 1) rawRequired = tokenCost
 * 2) select TokenPurchase batches FIFO (oldest first) to cover rawRequired (ignoring discount)
 * 3) compute discount for each batch (by time rules)
 * 4) discountPercent = max(batch discounts)
 * 5) effectiveRequired = ceil(rawRequired * (1 - discountPercent))
 * 6) deduct effectiveRequired tokens from batches FIFO (reduce remaining)
 * 7) create AdPurchase & TokenUsage records
 */

function getDiscountPercentForBatch(purchase: any) {
  // Example rules relative to createdAt / expiresAt
  const now = new Date();
  const created = new Date(purchase.createdAt);
  const expires = new Date(purchase.expiresAt);
  const totalDays = Math.max(1, Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
  const daysSinceStart = Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.round((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Policy:
  // - first 30 days since purchase => 10%
  // - 31-60 days => 7%
  // - 61- (totalDays - 14) => 5%
  // - last 14 days => 0%
  if (daysLeft <= 14) return 0;
  if (daysSinceStart <= 30) return 0.10;
  if (daysSinceStart <= 60) return 0.07;
  if (daysSinceStart <= totalDays - 14) return 0.05;
  return 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, adPackageId = null, position = null, scope, durationDays, tokenCost } = body;
    if (!shopId || !scope || !durationDays || !tokenCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    // Ensure wallet exists
    const wallet = await prisma.tokenWallet.findUnique({ where: { shopId } });
    if (!wallet) return NextResponse.json({ error: "No token wallet found" }, { status: 400 });

    // 1) Select batches FIFO to cover rawRequired = tokenCost
    const now = new Date();
    const candidateBatches = await prisma.tokenPurchase.findMany({
      where: {
        walletId: wallet.id,
        remaining: { gt: 0 },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" }, // FIFO
    });

    let need = tokenCost;
    const usedBatchesForRaw: { purchase: any; take: number }[] = [];
    for (const p of candidateBatches) {
      if (need <= 0) break;
      const available = p.remaining;
      const take = Math.min(available, need);
      if (take > 0) {
        usedBatchesForRaw.push({ purchase: p, take });
        need -= take;
      }
    }

    if (need > 0) {
      return NextResponse.json({ error: "Insufficient tokens to cover raw cost" }, { status: 400 });
    }

    // 2) Compute discount for these batches and pick max
    const discounts = usedBatchesForRaw.map((u) => getDiscountPercentForBatch(u.purchase));
    const maxDiscount = discounts.length ? Math.max(...discounts) : 0;

    // 3) Compute effective required tokens after discount
    const effectiveRequired = Math.ceil(tokenCost * (1 - maxDiscount));

    // 4) Deduct effectiveRequired tokens from batches FIFO (may be fewer than usedBatchesForRaw)
    let toDeduct = effectiveRequired;
    const usages: { purchaseId: string; used: number; discount: number }[] = [];

    for (const p of candidateBatches) {
      if (toDeduct <= 0) break;
      const avail = p.remaining;
      if (avail <= 0) continue;
      const take = Math.min(avail, toDeduct);
      // update remaining on the purchase
      await prisma.tokenPurchase.update({
        where: { id: p.id },
        data: { remaining: p.remaining - take },
      });
      usages.push({ purchaseId: p.id, used: take, discount: getDiscountPercentForBatch(p) });
      toDeduct -= take;
    }

    if (toDeduct > 0) {
      // This should not happen because we checked earlier, but guard
      return NextResponse.json({ error: "Insufficient tokens after discount adjustment" }, { status: 400 });
    }

    // update wallet balance (decrease by effectiveRequired)
    await prisma.tokenWallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - effectiveRequired },
    });

    // create token usage record per usage chunk
    for (const u of usages) {
      await prisma.tokenUsage.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          type: "ad_purchase",
          referenceId: null,
          amount: u.used,
        },
      });
    }

    // create AdPurchase record
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const ad = await prisma.adPurchase.create({
      data: {
        shop: { connect: { id: shopId } },
        adPackage: adPackageId ? { connect: { id: adPackageId } } : undefined,
        position,
        scope,
        durationDays,
        tokenCost,
        startAt,
        endAt,
        provider: "token",
      },
    });

    // update the tokenUsage referenceId to the created ad id
    await prisma.tokenUsage.updateMany({
      where: { walletId: wallet.id, type: "ad_purchase", referenceId: null },
      data: { referenceId: ad.id },
    });

    return NextResponse.json({ ad, effectiveRequired, discountApplied: maxDiscount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}