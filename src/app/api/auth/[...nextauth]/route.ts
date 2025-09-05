// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, DefaultSession, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";

import TikTokProvider from "@/lib/tiktok-provider";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// เพิ่ม type สำหรับ session.user
interface ExtendedUser extends NextAuthUser {
  id: string;
  role: "user" | "admin" | "shop";
}

interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;
      extendedSession.user.id = token.sub!;
      extendedSession.user.role = (token as { role?: "user" | "admin" | "shop" }).role ?? "user";
      return extendedSession;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: "user" | "admin" | "shop" }).role ?? "user";
      }
      return token;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// wrapper สำหรับ App Router
const authHandler = async (req: NextRequest) => {
  // NextAuth ต้องใช้ Node.js Request/Response
  const res = NextResponse.next();
  return await NextAuth(req as any, res as any, authOptions);
};

// export method สำหรับ App Router
export { authHandler as GET, authHandler as POST };
