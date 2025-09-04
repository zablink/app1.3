// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function requireUser() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw new Error("Unauthorized");
	return session;
} 