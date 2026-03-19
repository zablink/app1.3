import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseCartCookie, getCartCookieName } from "@/lib/cart/cart-cookie";
import { TOKEN_PACKS } from "@/lib/cart/catalog";
import { requireOwnerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Omise from "omise";

export const runtime = "nodejs";

const omise = new Omise({ secretKey: process.env.OMISE_SECRET_KEY || "" });

export async function POST(req: Request) {
  if (!process.env.OMISE_SECRET_KEY) {
    return NextResponse.json({ error: "Payment provider not configured" }, { status: 500 });
  }

  const jar = await cookies();
  const cart = parseCartCookie(jar.get(getCartCookieName())?.value);
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const authErr = await requireOwnerOrAdmin(req, cart.shopId);
  if (authErr) return authErr;

  const item = cart.items[0];

  if (item.kind === "subscription") {
    if (item.tier === "FREE") {
      return NextResponse.json({ error: "FREE tier does not require payment" }, { status: 400 });
    }

    const plans = await prisma.$queryRawUnsafe<Array<{ id: string; tier: string | null; name: string | null; price: number }>>(`
      SELECT id, tier, name, COALESCE(price, price_monthly, 0) as price
      FROM subscription_packages
      WHERE COALESCE(is_active, true) = true;
    `);

    const plan = plans.find(
      (p) => (p.tier || p.name || "").toUpperCase() === item.tier.toUpperCase()
    );
    if (!plan || !plan.price || plan.price <= 0) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
    }

    let finalPrice = Number(plan.price);
    if (item.context === "renewal") {
      const now = new Date();
      const campaigns = await prisma.promotionCampaign.findMany({
        where: {
          campaignType: "RENEWAL",
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const campaign of campaigns) {
        if (campaign.discountType === "PERCENTAGE") {
          const v = Number(campaign.discountValue || 0);
          finalPrice = finalPrice * (1 - v / 100);
        } else if (campaign.discountType === "FIXED_AMOUNT") {
          const v = Number(campaign.discountValue || 0);
          finalPrice = Math.max(0, finalPrice - v);
        }
      }

      finalPrice = Math.max(0, Math.round(finalPrice));
    }

    const origin = new URL(req.url).origin;
    const returnUri = `${origin}/payment?return=true`;

    const charge = await omise.charges.create({
      amount: Math.round(finalPrice * 100),
      currency: "thb",
      description: `${item.context === "renewal" ? "Renewal" : "Subscription"}: ${item.tier}`,
      return_uri: returnUri,
      metadata: { shopId: cart.shopId, action: "subscription", packageId: plan.id, packageName: item.tier },
    });

    return NextResponse.json({ kind: "subscription", charge });
  }

  if (item.kind === "token_pack") {
    const pack = TOKEN_PACKS[item.packId];
    if (!pack) return NextResponse.json({ error: "Invalid token pack" }, { status: 400 });

    // ensure wallet exists
    let wallet = await prisma.tokenWallet.findUnique({ where: { shop_id: cart.shopId } });
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: { shop_id: cart.shopId, balance: 0 },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const totalTokens = pack.baseTokens + pack.bonusTokens;

    const purchase = await prisma.tokenPurchase.create({
      data: {
        wallet: { connect: { id: wallet.id } },
        amount: totalTokens,
        remaining: totalTokens,
        price: pack.priceTHB,
        provider: "omise",
        providerRef: null,
        createdAt: now,
        expiresAt,
      },
    });

    const origin = new URL(req.url).origin;
    const returnUri = `${origin}/payment?return=true`;

    const charge = await omise.charges.create({
      amount: Math.round(pack.priceTHB * 100),
      currency: "thb",
      description: `Token purchase ${purchase.id}`,
      return_uri: returnUri,
      metadata: { shopId: cart.shopId, action: "token_purchase", tokenPurchaseId: purchase.id, packId: item.packId },
    });

    return NextResponse.json({ kind: "token_pack", purchase, charge });
  }

  return NextResponse.json({ error: "Unsupported cart item" }, { status: 400 });
}

