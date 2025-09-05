// src/lib/auth.ts
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";
import TikTokProvider from "@/lib/tiktok-provider";

// --- Extended Types ---
import type { DefaultSession, User as NextAuthUser } from "next-auth";

interface ExtendedUser extends NextAuthUser {
  id: string;
  role: "user" | "admin" | "shop";
}

interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
}

// --- options helper สำหรับ server-side ---
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
};

// --- helper function สำหรับ server-side usage ---
export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}
