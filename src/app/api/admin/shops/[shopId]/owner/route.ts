// /src/app/api/admin/shops/[shopId]/owner/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const shopId = (await params).shopId;
    const active = await prisma.shopSubscription.findFirst({
      where: { shop_id: shopId, status: "ACTIVE" },
      include: { subscription_packages: true },
      orderBy: { end_date: "desc" },
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
    const expiresAt = new Date(startedAt.getTime() + plan.period_days * 24 * 60 * 60 * 1000);

    const sub = await prisma.shopSubscription.create({
      data: {
        shop_id: shopId,
        package_id: packageId,
        status: "ACTIVE",
        start_date: startedAt,
        end_date: expiresAt,
        auto_renew: autoRenew,
        original_price: plan.price_monthly,
        final_price: plan.price_monthly,
        payment_status: "PENDING",
      },
      include: { subscription_packages: true },
    });

    // If plan grants tokens, grant tokens and create token purchase batch
    if (plan.token_amount && plan.token_amount > 0) {
      let wallet = await prisma.tokenWallet.findUnique({ where: { shop_id: shopId } });
      if (!wallet) {
        wallet = await prisma.tokenWallet.create({
          data: { shop_id: shopId, balance: plan.token_amount },
        });
      } else {
        await prisma.tokenWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: plan.token_amount } },
        });
      }
    }

    return NextResponse.json(sub);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
