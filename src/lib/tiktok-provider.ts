// src/lib/tiktok-provider.ts
import type { OAuthConfig, OAuthUserConfig } from "next-auth";

interface TikTokProfile {
  id: string;
  display_name: string;
  email?: string;
  // add more fields if needed
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
    profile(profile) {
      return {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
      };
    },
    options,
  };
}
