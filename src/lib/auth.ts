// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ✅ ต้องมี export เพื่อให้ import ได้
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    // Facebook Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอก email และ password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // ✅ Callbacks สำคัญมาก - ต้องมีเพื่อส่ง user.id ไปใน session
  callbacks: {
    async jwt({ token, user, account }) {
      // เมื่อ user login ครั้งแรก
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }

      if (!token.id && token.email) {
        console.log("⚠️ JWT: No token.id, fetching from database...");
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true },
          });
          
          if (dbUser) {
            console.log("✅ JWT: Found user id:", dbUser.id);
            token.id = dbUser.id;
            token.role = dbUser.role;
          } else {
            console.error("❌ JWT: User not found in database");
          }
        } catch (error) {
          console.error("❌ JWT: Error fetching user:", error);
        }
      }
      
      // เก็บ provider info (optional)
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // ✅ ส่ง user.id และ role เข้า session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      
      return session;
    },

    async signIn({ user, account, profile }) {
      // ถ้า login ด้วย OAuth (Google, Facebook)
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          // ตรวจสอบว่ามี user ในฐานข้อมูลหรือยัง
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // สร้าง user ใหม่
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                image: user.image,
                role: "USER",
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }

      return true;
    },
  },

  // ✅ Session settings
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ✅ Secret key สำคัญมาก!
  secret: process.env.NEXTAUTH_SECRET,

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Pages
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },

  // Debug (เปิดใน development)
  debug: process.env.NODE_ENV === "development",
};