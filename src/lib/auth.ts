// lib/auth.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
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
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),

    // LINE OAuth - Disabled: No credentials configured
    // {
    //   id: 'line',
    //   name: 'LINE',
    //   type: 'oauth',
    //   authorization: {
    //     url: 'https://access.line.me/oauth2/v2.1/authorize',
    //     params: {
    //       scope: 'profile openid email',
    //       bot_prompt: 'normal',
    //     },
    //   },
    //   token: 'https://api.line.me/oauth2/v2.1/token',
    //   userinfo: 'https://api.line.me/v2/profile',
    //   clientId: process.env.LINE_CLIENT_ID || "",
    //   clientSecret: process.env.LINE_CLIENT_SECRET || "",
    //   profile(profile: any) {
    //     return {
    //       id: profile.userId,
    //       name: profile.displayName,
    //       email: profile.email || `${profile.userId}@line.local`,
    //       image: profile.pictureUrl,
    //     };
    //   },
    // },

    // TikTok OAuth - Disabled: No credentials configured
    // {
    //   id: 'tiktok',
    //   name: 'TikTok',
    //   type: 'oauth',
    //   authorization: {
    //     url: 'https://www.tiktok.com/v2/auth/authorize',
    //     params: {
    //       client_key: process.env.TIKTOK_CLIENT_KEY,
    //       scope: 'user.info.basic',
    //       response_type: 'code',
    //     },
    //   },
    //   token: 'https://open.tiktokapis.com/v2/oauth/token/',
    //   userinfo: 'https://open.tiktokapis.com/v2/user/info/',
    //   clientId: process.env.TIKTOK_CLIENT_KEY || "",
    //   clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
    //   profile(profile: any) {
    //     return {
    //       id: profile.data?.user?.open_id || profile.open_id,
    //       name: profile.data?.user?.display_name || profile.display_name,
    //       email: `${profile.data?.user?.open_id || profile.open_id}@tiktok.local`,
    //       image: profile.data?.user?.avatar_url || profile.avatar_url,
    //     };
    //   },
    // },

    // Instagram OAuth (via Facebook) - Disabled: No credentials configured
    // {
    //   id: 'instagram',
    //   name: 'Instagram',
    //   type: 'oauth',
    //   authorization: {
    //     url: 'https://api.instagram.com/oauth/authorize',
    //     params: {
    //       scope: 'user_profile,user_media',
    //     },
    //   },
    //   token: 'https://api.instagram.com/oauth/access_token',
    //   userinfo: 'https://graph.instagram.com/me?fields=id,username,account_type',
    //   clientId: process.env.INSTAGRAM_CLIENT_ID || "",
    //   clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
    //   profile(profile: any) {
    //     return {
    //       id: profile.id,
    //       name: profile.username,
    //       email: `${profile.username}@instagram.local`,
    //       image: `https://www.instagram.com/${profile.username}/`,
    //     };
    //   },
    // },

    // X (Twitter) OAuth 2.0
    {
      id: 'twitter',
      name: 'X (Twitter)',
      type: 'oauth',
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read tweet.read',
        },
      },
      token: 'https://api.twitter.com/2/oauth2/token',
      userinfo: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      profile(profile: any) {
        return {
          id: profile.data?.id || profile.id,
          name: profile.data?.name || profile.name,
          email: `${profile.data?.username || profile.username}@twitter.local`,
          image: profile.data?.profile_image_url || profile.profile_image_url,
        };
      },
    },

    // Email & Password
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
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
        } as any;
      }
    }),

    // Phone Number (OTP) - TODO: Enable after adding otp_codes table and SMS service
    // CredentialsProvider({
    //   id: 'phone',
    //   name: 'Phone Number',
    //   credentials: {
    //     phone: { label: "Phone", type: "tel", placeholder: "0812345678" },
    //     otp: { label: "OTP Code", type: "text", placeholder: "123456" }
    //   },
    //   async authorize(credentials) {
    //     if (!credentials?.phone) {
    //       throw new Error('กรุณากรอกเบอร์โทรศัพท์');
    //     }
    //     // ... OTP verification logic
    //     throw new Error('OTP_REQUIRED');
    //   }
    // }),
  ],

  // หน้าที่ใช้สำหรับ sign in และ error
  pages: {
    signIn: "/signin",
    error: "/signin",
    verifyRequest: "/signin",
  },

  callbacks: {
    // เพิ่ม user id และ role เข้าไปใน session
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
        
        // ดึง role จาก database (real-time)
        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              select: { role: true },
            });
            session.user.role = dbUser?.role || "USER";
          } catch (error) {
            console.error("Error fetching user role:", error);
            session.user.role = "USER";
          }
        }
      }
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "USER";
      }
      return token;
    },

    async signIn({ user, account }) {
      console.log('🔐 signIn callback triggered');
      console.log('👤 User:', JSON.stringify(user, null, 2));
      console.log('🔑 Account:', JSON.stringify(account, null, 2));
      
      try {
        // ตรวจสอบว่ามี user email
        if (!user.email) {
          console.error("❌ No email provided");
          return false;
        }

        console.log('✅ Email found:', user.email);

        // สำหรับ user ใหม่ ให้ set role เป็น USER
        if (account && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Log สำหรับ debug
          if (!existingUser) {
            console.log("🆕 New user signing in:", user.email);
          } else {
            console.log("👋 Existing user:", user.email, "Role:", existingUser.role);
          }
        }
        
        console.log('✅ Sign in successful');
        return true;
      } catch (error) {
        console.error("❌ Sign in error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
        return false;
      }
    },

    // Custom redirect behavior
    async redirect({ url, baseUrl }) {
      // ถ้า URL เริ่มต้นด้วย "/" ให้ใช้ baseUrl + url
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // ถ้า URL เป็น baseUrl ให้ redirect ได้
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // ถ้าไม่ใช่ ให้กลับไปหน้าแรก
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  // เปิด debug mode สำหรับ development
  debug: process.env.NODE_ENV === "development",

  // Event handlers สำหรับ logging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("User signed in:", {
        email: user.email,
        provider: account?.provider,
        isNewUser
      });
    },
    async signOut({ token }) {
      console.log("User signed out:", token.email);
    },
    async createUser({ user }) {
      console.log("New user created:", user.email);
    },
  },
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
 * Require shop owner or admin role (alias for requireShopOwner)
 */
export async function requireOwnerOrAdmin(req?: Request, shopId?: string) {
  // If shopId is provided, check if user owns the shop or is admin
  if (shopId && req) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRole = (session.user as any).role || 'USER';
    
    // Admin can access any shop
    if (userRole === 'ADMIN') {
      return null;
    }
    
    // Check if user owns the shop
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true }
      });
      
      if (!shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      
      if (shop.ownerId === session.user.id) {
        return null;
      }
      
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } catch (error) {
      console.error('Error checking shop ownership:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // Fallback to role-based check
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

/**.  
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
  return (session?.user as any)?.id || null;
}

/**
 * Get user role from session
 */
export async function getUserRole() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  return (session.user as any).role || 'USER';
}

// Explicitly export requireOwnerOrAdmin and authOptions for use in API routes

