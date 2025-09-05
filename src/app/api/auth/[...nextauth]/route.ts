// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";
import TikTokProvider from "@/lib/tiktok-provider";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { NextAuthRequest, NextAuthResponse } from "next-auth/core/types";

// --- Extended Types ---
import type { DefaultSession, User as NextAuthUser } from "next-auth";

interface ExtendedUser extends NextAuthUser {
  id: string;
  role: "user" | "admin" | "shop";
}

interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
}

// --- NextAuth options (ไม่ต้อง export) ---
const options = {
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

// --- App Router handler ---
const handler = async (req: NextRequest) => {
  const nodeReq = req as unknown as NextAuthRequest;
  const nodeRes = NextResponse.next() as unknown as NextAuthResponse;

  return NextAuth(nodeReq, nodeRes, options);
};

// export per HTTP method
export { handler as GET, handler as POST };
