// src/lib/auth.ts
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- server-side helper ---
export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}
