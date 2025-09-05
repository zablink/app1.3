// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Twitter from "next-auth/providers/twitter"; // X
import Email from "next-auth/providers/email";
//import { prisma } from "@/lib/db";


// TikTok (Generic OAuth2)
import type { OAuthConfig } from "next-auth/providers";
const TikTok = {
	id: "tiktok",
	name: "TikTok",
	type: "oauth",
	wellKnown: undefined,
	authorization: { url: process.env.TIKTOK_AUTH_URL! },
	token: { url: process.env.TIKTOK_TOKEN_URL! },
	userinfo: { url: process.env.TIKTOK_USERINFO_URL! },
	profile: (raw: any) => {
		const u = raw?.data?.user || raw;
		return { id: u.id?.toString() ?? u.open_id, name: u.display_name, email: undefined, image: u.avatar_url };
	},
	clientId: process.env.TIKTOK_CLIENT_ID!,
	clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
} satisfies OAuthConfig<any>;


export const authOptions: NextAuthOptions = {
	//adapter: PrismaAdapter(prisma),
	session: { strategy: "database" },
	providers: [Google, Facebook, Twitter, Email, TikTok],
	callbacks: {
		async session({ session, user }) {
		if (session.user) {
			(session.user as any).id = user.id;
			(session.user as any).role = user.role;
		}
		return session;
		},
	},
};


const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };