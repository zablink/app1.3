// src/app/api/auth/[...nextauth]/route.ts

//import NextAuth, { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),

    // เพิ่ม providers อื่นๆ ตามต้องการ
    // LINE, Twitter, etc.
  ],

  // ⭐ สำคัญ: กำหนดหน้าที่ใช้สำหรับ sign in และ error
  pages: {
    signIn: "/signin",       // หน้า sign in custom
    error: "/signin",         // เมื่อเกิด error ให้กลับมาที่หน้า signin
    verifyRequest: "/signin", // หน้ายืนยันอีเมล (ถ้าใช้ email login)
    // newUser: "/welcome",   // optional: หน้าสำหรับ user ใหม่
  },

  callbacks: {
    // เพิ่ม user id และ role เข้าไปใน session
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
    
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || "USER";
      }
      return token;
    },

    async signIn({ user, account, profile }) {
      try {
        // ตรวจสอบว่ามี user email
        if (!user.email) {
          console.error("No email provided");
          return false;
        }

        // สำหรับ user ใหม่ ให้ set role เป็น USER
        if (account && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Log สำหรับ debug
          if (!existingUser) {
            console.log("New user signing in:", user.email);
          }
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        // Return false จะทำให้ redirect ไปหน้า error
        return false;
      }
    },

    // Custom redirect behavior
    async redirect({ url, baseUrl }) {
      // ถ้า URL เริ่มต้นด้วย "/" ให้ใช้ baseUrl + url
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // ถ้า URL เป็น baseUrl ให้ redirect ได้
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // ถ้าไม่ใช่ ให้กลับไปหน้าแรก
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  // เปิด debug mode สำหรับ development
  debug: process.env.NODE_ENV === "development",

  // Event handlers สำหรับ logging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", {
        email: user.email,
        provider: account?.provider,
        isNewUser
      });
    },
    async signOut({ token }) {
      console.log("User signed out:", token.email);
    },
    async createUser({ user }) {
      console.log("New user created:", user.email);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };