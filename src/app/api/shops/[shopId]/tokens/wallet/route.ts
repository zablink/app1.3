// src/app/api/shops/[shopId]/tokens/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

/**
 * GET /api/shops/[shopId]/tokens/wallet
 * ดึงข้อมูล Token Wallet ของร้าน
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const shopId = (await params).shopId;
    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    // Get or create wallet
    let wallet = await prisma.tokenWallet.findUnique({
      where: { shop_id: shopId },
    });

    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: {
          shop_id: shopId,
          balance: 0,
        },
      });
    }

    // Get token purchases (batches)
    const purchases = await prisma.tokenPurchase.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "asc" },
    });

    // Get token usages
    const usages = await prisma.tokenUsage.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 transactions
    });

    // Calculate expiring soon (next 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = purchases.filter(
      (p) =>
        p.remaining > 0 &&
        p.expiresAt &&
        p.expiresAt <= thirtyDaysLater &&
        p.expiresAt > now
    );

    const expiringSoonAmount = expiringSoon.reduce(
      (sum, p) => sum + p.remaining,
      0
    );

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        createdAt: wallet.createdAt || wallet.created_at,
        updatedAt: wallet.updatedAt || wallet.updated_at,
      },
      purchases,
      usages,
      expiringSoon: {
        amount: expiringSoonAmount,
        batches: expiringSoon.map((p) => ({
          id: p.id,
          amount: p.remaining,
          expiresAt: p.expiresAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching token wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
