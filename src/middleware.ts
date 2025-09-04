// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export async function middleware(req: NextRequest) {
const { cookies, nextUrl } = req;
const role = cookies.get("next-auth.session-token-role")?.value;
const path = nextUrl.pathname;


const requireShop = path.startsWith("/dashboard/shop");
const requireAdmin = path.startsWith("/admin");


if (requireAdmin && role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
if (requireShop && !(role === "SHOP" || role === "ADMIN")) return NextResponse.redirect(new URL("/dashboard/user", req.url));
return NextResponse.next();
}


export const config = {
matcher: ["/dashboard/:path*", "/admin/:path*"],
};