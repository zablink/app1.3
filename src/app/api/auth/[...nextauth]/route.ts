import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// **App Router handler**
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
