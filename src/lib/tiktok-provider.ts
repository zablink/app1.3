// src/lib/tiktok-provider.ts
import { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface TikTokProfile {
  open_id: string
  union_id?: string
  avatar_url?: string
  display_name?: string
}

export default function TikTokProvider<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    version: "2.0",
    authorization: "https://www.tiktok.com/v2/auth/authorize/",
    token: "https://open.tiktokapis.com/v2/oauth/token/",
    userinfo: "https://open.tiktokapis.com/v2/user/info/",
    profile(profile) {
      return {
        id: profile.open_id,
        name: profile.display_name,
        image: profile.avatar_url,
      }
    },
    options,
  }
}
