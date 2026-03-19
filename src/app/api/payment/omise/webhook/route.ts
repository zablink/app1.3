// src/app/api/payment/omise/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Very basic webhook handler. Adjust verification per Omise docs.
 * Omise sends events - implement HMAC/Signature verification in production.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const event = payload;
    // Example structure handling - adjust to actual Omise webhook payload fields
    if (event?.data?.object === "charge" && event?.data?.status === "successful") {
      const data = event.data;
      const metadata = data?.metadata || {};
      const shopId = metadata.shopId as string | undefined;
      const action = metadata.action as string | undefined;
      const providerRef = data.id;

      if (shopId && action === "subscription") {
        // Mark the most recent pending subscription as paid
        const subscription = await prisma.shopSubscription.findFirst({
          where: {
            shop_id: shopId,
            payment_status: "PENDING",
          },
          orderBy: { created_at: "desc" },
        });

        if (subscription) {
          await prisma.shopSubscription.update({
            where: { id: subscription.id },
            data: { 
              payment_status: "PAID",
              paid_at: new Date(),
              status: "ACTIVE",
            },
          });
        } else {
          // If no pending subscription found, try to find by packageId from metadata
          const packageId = metadata.packageId as string | undefined;
          if (packageId) {
            await prisma.shopSubscription.updateMany({
              where: {
                shop_id: shopId,
                package_id: packageId,
                payment_status: "PENDING",
              },
              data: {
                payment_status: "PAID",
                paid_at: new Date(),
                status: "ACTIVE",
              },
            });
          }
        }
      } else if (shopId && action === "token_purchase") {
        const purchaseId = metadata.tokenPurchaseId as string | undefined;
        if (purchaseId) {
          await prisma.tokenPurchase.update({
            where: { id: purchaseId },
            data: { providerRef },
          });
          // add tokens to wallet balance if not already added
          const purchase = await prisma.tokenPurchase.findUnique({ where: { id: purchaseId } });
          if (purchase) {
            const wallet = await prisma.tokenWallet.findUnique({ where: { shop_id: shopId } });
            if (wallet) {
              await prisma.tokenWallet.update({
                where: { id: wallet.id },
                data: { balance: wallet.balance + purchase.amount },
              });
            } else {
              await prisma.tokenWallet.create({
                data: { shop_id: shopId, balance: purchase.amount },
              });
            }
          }
        }
      }
      // Add more event handling as needed
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}