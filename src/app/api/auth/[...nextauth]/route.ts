// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter"; // X
import Email from "next-auth/providers/email";
// import { prisma } from "@/lib/db";

import type { OAuthConfig } from "next-auth/providers";

// ----- TikTok (Generic OAuth2) -----
interface TikTokUser {
  id?: string;
  open_id?: string;
  display_name?: string;
  avatar_url?: string;
}

interface TikTokProfileResponse {
  data?: { user?: TikTokUser };
}

const TikTok: OAuthConfig<TikTokProfileResponse> = {
  id: "tiktok",
  name: "TikTok",
  type: "oauth",
  authorization: { url: process.env.TIKTOK_AUTH_URL! },
  token: { url: process.env.TIKTOK_TOKEN_URL! },
  userinfo: { url: process.env.TIKTOK_USERINFO_URL! },
  profile: (raw: TikTokProfileResponse) => {
    const u = raw?.data?.user || raw;
    return {
      id: u?.id?.toString() ?? u?.open_id,
      name: u?.display_name,
      email: undefined,
      image: u?.avatar_url,
    };
  },
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
};

// ----- NextAuth Config -----
export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // เปลี่ยนจาก database → jwt ชั่วคราว
  providers: [Google, Facebook, Twitter, Email, TikTok],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = user.id;
        (session.user as { id?: string; role?: string }).role = (user as { role?: string }).role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
