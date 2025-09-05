// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter"; // X
import EmailProvider from "next-auth/providers/email";
import type { OAuthConfig } from "next-auth/providers";

// -----------------------------
// Custom TikTok Provider
// -----------------------------
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
  profile: (raw) => {
    const u = raw?.data?.user || {};
    return {
      id: u.id?.toString() ?? u.open_id,
      name: u.display_name,
      email: undefined,
      image: u.avatar_url,
    };
  },
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
};

// -----------------------------
// NextAuth Config
// -----------------------------
export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // ยังไม่ใช้ DB ให้ remark ไว้ก่อน
  session: { strategy: "jwt" }, // เปลี่ยนเป็น jwt ถ้ายังไม่ใช้ database
  providers: [
    GoogleProvider,
    FacebookProvider,
    TwitterProvider,
    EmailProvider,
    TikTok,
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // เก็บ id/role ใน token แทนการอ้าง DB
        (session.user as { id?: string; role?: string }).id = token.sub;
        (session.user as { id?: string; role?: string }).role =
          (token as { role?: string }).role ?? "user";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
