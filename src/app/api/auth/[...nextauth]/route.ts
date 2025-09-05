// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";

import TikTokProvider from "@/lib/tiktok-provider"; // Custom TikTok provider
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// -----------------------------
// NextAuth Config
// -----------------------------
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // ใช้ Prisma DB
  session: { strategy: "jwt" },
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
    TikTokProvider({
      clientId: process.env.TIKTOK_CLIENT_ID!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // -----------------------------
    // Session Callback
    // -----------------------------
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token as any).role ?? "user";
      }
      return session;
    },

    // -----------------------------
    // JWT Callback
    // -----------------------------
    async jwt({ token, user }) {
      if (user) {
        // user.role มาจาก DB ผ่าน adapter
        token.role = (user as any).role ?? "user";
      }
      return token;
    },
  },

  // -----------------------------
  // Pages (ถ้าต้องการ custom หน้า login)
  // -----------------------------
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // -----------------------------
  // Debug
  // -----------------------------
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
