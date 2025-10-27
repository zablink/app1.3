// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // เพิ่ม providers อื่นๆ เมื่อตั้งค่าเสร็จแล้ว
  ],

  pages: {
    signIn: "/signin",
    error: "/signin", // redirect error กลับมาที่หน้า signin
  },

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
    
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || "USER";
      }
      return token;
    },

    async signIn({ user, account, profile }) {
      try {
        // สำหรับ user ใหม่ ให้ set role เป็น USER
        if (account && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // ถ้ายังไม่มี user ใน database
          if (!existingUser) {
            // PrismaAdapter จะสร้าง user ให้อัตโนมัติ
            // เราแค่ต้อง update role ทีหลัง
            console.log("New user signed in:", user.email);
          }
        }
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };