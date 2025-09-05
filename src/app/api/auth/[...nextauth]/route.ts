// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter"; // ยังไม่ใช้ DB
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter"; // X
import Email from "next-auth/providers/email";
// import { prisma } from "@/lib/db"; // remark ไว้ก่อน

import type { OAuthConfig } from "next-auth/providers";

// TikTok (Generic OAuth2)
const TikTok = {
  id: "tiktok",
  name: "TikTok",
  type: "oauth",
  wellKnown: undefined,
  authorization: { url: process.env.TIKTOK_AUTH_URL! },
  token: { url: process.env.TIKTOK_TOKEN_URL! },
  userinfo: { url: process.env.TIKTOK_USERINFO_URL! },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: (raw: any) => {
    const u = (raw as any)?.data?.user || raw;
    return {
      id: u.id?.toString() ?? u.open_id,
      name: u.display_name,
      email: undefined,
      image: u.avatar_url,
    };
  },
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
} satisfies OAuthConfig<unknown>;

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // ยังไม่ใช้ DB
  // ❌ strategy: "database" → ต้องใช้ DB
  // ✅ เปลี่ยนเป็น jwt ชั่วคราว
  session: { strategy: "jwt" },
  providers: [Google, Facebook, Twitter, Email, TikTok],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = (token as any).role ?? "user";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
