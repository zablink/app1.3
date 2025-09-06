// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// เพิ่ม field role เข้าไปใน User
declare module "next-auth" {
  interface User extends DefaultUser {
    role: "admin" | "shop" | "user";
  }

  interface Session {
    user: {
      id: string;
      role: "admin" | "shop" | "user";
    } & DefaultSession["user"];
  }
}

// ให้ JWT มี role ด้วย
declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "shop" | "user";
  }
}
