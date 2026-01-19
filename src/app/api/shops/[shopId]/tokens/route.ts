// src/app/api/shops/[shopId]/tokens/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Omise from "omise";
import { requireOwnerOrAdmin } from "@/lib/auth";

const omise = new Omise({ secretKey: process.env.OMISE_SECRET_KEY || "" });

export async function POST(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const shopId = (await params).shopId;
  const authErr = await requireOwnerOrAdmin(req, shopId);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { amountTokens, price } = body;
    if (!amountTokens || !price) return NextResponse.json({ error: "amountTokens and price required" }, { status: 400 });

    // ensure wallet exists
    let wallet = await prisma.tokenWallet.findUnique({ where: { shopId } });
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: { shop: { connect: { id: shopId } }, balance: 0 },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // default 3 months

    const purchase = await prisma.tokenPurchase.create({
      data: {
        wallet: { connect: { id: wallet.id } },
        amount: amountTokens,
        remaining: amountTokens,
        price,
        provider: "omise",
        providerRef: null,
        createdAt: now,
        expiresAt,
      },
    });

    // create omise charge with metadata so webhook can tie back
    const charge = await omise.charges.create({
      amount: Math.round(price * 100),
      currency: "thb",
      description: `Token purchase ${purchase.id}`,
      metadata: { shopId, action: "token_purchase", tokenPurchaseId: purchase.id },
    });

    return NextResponse.json({ purchase, charge });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}