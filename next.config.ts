import type { NextConfig } from "next";

// Next 16 NextConfig type อาจไม่มี eslint — runtime ยังรองรับ ignoreDuringBuilds
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
  remotePatterns: [
    // Supabase Storage
    {
      protocol: 'https',
      hostname: 'vygryagvxjewxdzgipea.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
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
} as NextConfig;

export default nextConfig;
