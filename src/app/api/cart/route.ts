import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { cartSchema, getCartCookieName, parseCartCookie, serializeCart } from "@/lib/cart/cart-cookie";

export const runtime = "nodejs";

const setCartBodySchema = z.object({
  shopId: z.string().min(1),
  item: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("subscription"),
      tier: z.enum(["FREE", "BASIC", "PRO", "PREMIUM"]),
      context: z.enum(["purchase", "renewal"]).optional(),
    }),
    z.object({ kind: z.literal("token_pack"), packId: z.enum(["pack_100", "pack_500", "pack_1000", "pack_5000"]) }),
  ]),
});

export async function GET() {
  const jar = await cookies();
  const cart = parseCartCookie(jar.get(getCartCookieName())?.value);
  return NextResponse.json({ cart });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = setCartBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const cart = cartSchema.parse({
    v: 1,
    shopId: parsed.data.shopId,
    items: [parsed.data.item],
    createdAt: Date.now(),
  });

  const jar = await cookies();
  jar.set(getCartCookieName(), serializeCart(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return NextResponse.json({ cart });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(getCartCookieName());
  return NextResponse.json({ ok: true });
}

