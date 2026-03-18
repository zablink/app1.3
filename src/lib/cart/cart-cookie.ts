import crypto from "crypto";
import { z } from "zod";

const CART_COOKIE = "zablink_cart";

const cartItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("subscription"),
    tier: z.enum(["FREE", "BASIC", "PRO", "PREMIUM"]),
    context: z.enum(["purchase", "renewal"]).optional(),
  }),
  z.object({
    kind: z.literal("token_pack"),
    packId: z.enum(["pack_100", "pack_500", "pack_1000", "pack_5000"]),
  }),
]);

export const cartSchema = z.object({
  v: z.literal(1),
  shopId: z.string().min(1),
  items: z.array(cartItemSchema).max(5),
  createdAt: z.number().int(),
});

export type Cart = z.infer<typeof cartSchema>;

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for cart signing");
  return secret;
}

function sign(payloadB64: string) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function serializeCart(cart: Cart) {
  const payload = Buffer.from(JSON.stringify(cart), "utf8").toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function parseCartCookie(value: string | undefined | null): Cart | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const parsed = cartSchema.safeParse(json);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function getCartCookieName() {
  return CART_COOKIE;
}

