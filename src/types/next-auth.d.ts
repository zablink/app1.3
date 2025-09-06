// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin" | "shop";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "user" | "admin" | "shop";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin" | "shop";
  }
}
