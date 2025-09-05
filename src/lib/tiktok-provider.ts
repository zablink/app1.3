// src/lib/tiktok-provider.ts
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

interface TikTokProfile {
  id: string;
  display_name: string;
  email?: string;
  // เพิ่ม fields อื่น ๆ ตามต้องการ
}

export default function TikTokProvider<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    authorization: "https://www.tiktok.com/auth/authorize/",
    token: "https://open-api.tiktok.com/oauth/access_token/",
    userinfo: "https://open-api.tiktok.com/oauth/userinfo/",
    profile(profile: P) {
      return {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
      };
    },
    options,
  };
}
