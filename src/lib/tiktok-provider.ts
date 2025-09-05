// src/lib/tiktok-provider.ts
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"; // แก้ path ให้ถูกต้อง
import { OAuth2Provider } from "next-auth/providers"; // ถ้าจำเป็นต้องใช้ OAuth2Provider

export interface TikTokProfile {
  id: string;
  displayName: string;
  username: string;
  // เพิ่ม field ตาม response ของ TikTok API
}

export default function TikTokProvider<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    version: "2.0",
    scope: "user.info.basic",
    params: { grant_type: "authorization_code" },
    accessTokenUrl: "https://open-api.tiktokglobalshop.com/oauth/access_token/",
    authorization: "https://open-api.tiktokglobalshop.com/oauth/authorize",
    profileUrl: "https://open-api.tiktokglobalshop.com/oauth/userinfo",
    async profile(profile: P) {
      return {
        id: profile.id,
        name: profile.displayName,
        username: profile.username,
      };
    },
    ...options,
  };
}
