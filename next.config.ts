import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ปิด TypeScript errors ไม่ให้ block build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ปิด ESLint errors ไม่ให้ block build  
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    images: {
    remotePatterns: [
      // Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Facebook
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      // LINE
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
      // Twitter/X
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
      },
      // TikTok
      {
        protocol: 'https',
        hostname: 'p16-sign-sg.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-amd-va.tiktokcdn.com',
      },
      // GitHub (ถ้าเพิ่มในอนาคต)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      ],
    },
  },
};

export default nextConfig;
