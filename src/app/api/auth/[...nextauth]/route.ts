// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, DefaultSession, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";

import TikTokProvider from "@/lib/tiktok-provider"; // Custom TikTok provider

// -----------------------------
// Type-safe extension for session
// -----------------------------
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin"; // ปรับตาม Role ใน Prisma
    } & DefaultSession["user"];
  }

  interface User extends NextAuthUser {
    role?: "user" | "admin";
  }
}

// -----------------------------
// NextAuth Config
// -----------------------------
export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // ยังไม่ใช้ DB ให้ remark ไว้ก่อน
  session: { strategy: "jwt" }, // ใช้ JWT ชั่วคราว

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),

    // TikTok Provider (Custom)
    TikTokProvider({
      clientId: process.env.TIKTOK_CLIENT_ID!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token as { role?: "user" | "admin" }).role ?? "user";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
