// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

// ✅ Extend NextAuth types เพื่อเพิ่ม id และ role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    email: string;
    provider?: string;
  }
}