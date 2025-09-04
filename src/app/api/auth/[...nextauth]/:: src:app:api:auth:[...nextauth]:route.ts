// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import XProvider from "next-auth/providers/twitter";
import TikTokProvider from "next-auth/providers/tiktok";
import EmailProvider from "next-auth/providers/email";

export const authOptions = {
  providers: [
    GoogleProvider({ clientId: process.env.GOOGLE_ID!, clientSecret: process.env.GOOGLE_SECRET! }),
    FacebookProvider({ clientId: process.env.FB_ID!, clientSecret: process.env.FB_SECRET! }),
    XProvider({ clientId: process.env.X_ID!, clientSecret: process.env.X_SECRET! }),
    TikTokProvider({ clientId: process.env.TT_ID!, clientSecret: process.env.TT_SECRET! }),
    EmailProvider({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role; // add role to session
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
