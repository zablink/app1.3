import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// **ต้อง export เป็น GET / POST** สำหรับ App Router
export { handler as GET, handler as POST };
