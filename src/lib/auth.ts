// lib/auth.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),

    // LINE OAuth
    {
      id: 'line',
      name: 'LINE',
      type: 'oauth',
      authorization: {
        url: 'https://access.line.me/oauth2/v2.1/authorize',
        params: {
          scope: 'profile openid email',
          bot_prompt: 'normal',
        },
      },
      token: 'https://api.line.me/oauth2/v2.1/token',
      userinfo: 'https://api.line.me/v2/profile',
      clientId: process.env.LINE_CLIENT_ID || '',
      clientSecret: process.env.LINE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.displayName,
          email: profile.email || `${profile.userId}@line.local`,
          image: profile.pictureUrl,
        };
      },
    },

    // TikTok OAuth
    {
      id: 'tiktok',
      name: 'TikTok',
      type: 'oauth',
      authorization: {
        url: 'https://www.tiktok.com/v2/auth/authorize',
        params: {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          scope: 'user.info.basic',
          response_type: 'code',
        },
      },
      token: {
        url: 'https://open.tiktokapis.com/v2/oauth/token/',
        async request(context) {
          const tokens = await context.client.grant({
            grant_type: 'authorization_code',
            code: context.params.code,
            redirect_uri: context.provider.callbackUrl,
          });
          return { tokens };
        },
      },
      userinfo: {
        url: 'https://open.tiktokapis.com/v2/user/info/',
        async request(context) {
          return await fetch(context.provider.userinfo?.url as string, {
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
          }).then(res => res.json());
        },
      },
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.data.user.open_id,
          name: profile.data.user.display_name,
          email: `${profile.data.user.open_id}@tiktok.local`,
          image: profile.data.user.avatar_url,
        };
      },
    },

    // Twitter/X OAuth
    {
      id: 'twitter',
      name: 'Twitter',
      type: 'oauth',
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read tweet.read',
        },
      },
      token: 'https://api.twitter.com/2/oauth2/token',
      userinfo: 'https://api.twitter.com/2/users/me',
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: `${profile.data.username}@twitter.local`,
          image: profile.data.profile_image_url,
        };
      },
    },

    // Email/Password (Credentials)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('ไม่พบผู้ใช้งาน');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      }
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Update session
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'USER';
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get server session with proper typing
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - return 401 if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null
    };
  }
  
  return {
    error: null,
    session
  };
}

/**
 * Require specific role - return 403 if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null
    };
  }
  
  const userRole = (session.user as any).role || 'USER';
  
  if (!allowedRoles.includes(userRole)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      session: null
    };
  }
  
  return {
    error: null,
    session
  };
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole(['ADMIN']);
}

/**
 * Require shop owner role
 */
export async function requireShopOwner() {
  return requireRole(['SHOP', 'ADMIN']);
}

/**
 * Require creator role
 */
export async function requireCreator() {
  return requireRole(['CREATOR', 'ADMIN']);
}

/**
 * Check if user is authenticated (returns boolean)
 */
export async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role || 'USER';
  return userRole === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  return hasRole('ADMIN');
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Get user ID from session
 */
export async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * Get user role from session
 */
export async function getUserRole() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  return (session.user as any).role || 'USER';
}
