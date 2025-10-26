// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // ==========================================
    // 1. GOOGLE OAUTH
    // ==========================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // ==========================================
    // 2. FACEBOOK OAUTH
    // ==========================================
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // ==========================================
    // 3. TWITTER/X OAUTH 2.0
    // ==========================================
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),

    // ==========================================
    // 4. LINE OAUTH (Custom Provider)
    // ==========================================
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      wellKnown: "https://access.line.me/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "profile openid email",
          bot_prompt: "normal"
        }
      },
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },

    // ==========================================
    // 5. TIKTOK OAUTH (Custom Provider)
    // ==========================================
    {
      id: "tiktok",
      name: "TikTok",
      type: "oauth",
      authorization: {
        url: "https://www.tiktok.com/v2/auth/authorize/",
        params: {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          scope: "user.info.basic,user.info.profile",
          response_type: "code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/tiktok`,
        },
      },
      token: {
        url: "https://open.tiktokapis.com/v2/oauth/token/",
        async request({ params, provider }) {
          const response = await fetch(provider.token.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_key: process.env.TIKTOK_CLIENT_KEY!,
              client_secret: process.env.TIKTOK_CLIENT_SECRET!,
              code: params.code,
              grant_type: "authorization_code",
              redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/tiktok`,
            }),
          });
          const tokens = await response.json();
          return { tokens };
        },
      },
      userinfo: {
        url: "https://open.tiktokapis.com/v2/user/info/",
        async request({ tokens, provider }) {
          const response = await fetch(provider.userinfo.url, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });
          const data = await response.json();
          return data.data.user;
        },
      },
      profile(profile) {
        return {
          id: profile.open_id || profile.union_id,
          name: profile.display_name,
          email: null,
          image: profile.avatar_url || profile.avatar_large_url,
        };
      },
      clientId: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    },
  ],

  // ==========================================
  // PAGES CONFIGURATION
  // ==========================================
  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  // ==========================================
  // CALLBACKS
  // ==========================================
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
        
        // ดึง role จาก database
        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              select: { role: true },
            });
            session.user.role = dbUser?.role || "USER";
          } catch (error) {
            console.error("Error fetching user role:", error);
            session.user.role = "USER";
          }
        }
      }
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "USER";
      }
      return token;
    },

    async signIn({ user, account }) {
      // สำหรับ user ใหม่ ให้ set role เป็น USER
      if (account && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // ถ้ายังไม่มี role ให้ set เป็น USER
          if (existingUser && !existingUser.role) {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: "USER" },
            });
          }
        } catch (error) {
          console.error("Error updating user role:", error);
        }
      }
      return true;
    },
  },

  // ==========================================
  // SESSION CONFIGURATION
  // ==========================================
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ==========================================
  // SECRET KEY
  // ==========================================
  secret: process.env.NEXTAUTH_SECRET,

  // ==========================================
  // DEBUG MODE (เปิดเฉพาะ development)
  // ==========================================
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };