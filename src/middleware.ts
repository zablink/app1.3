// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow registration pages for authenticated users (any role)
    if (path === "/shop/register" || path === "/creator/register") {
      return NextResponse.next();
    }

    // Admin routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Shop Owner routes
    if (path.startsWith("/dashboard/shop")) {
      if (token?.role !== "SHOP" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Creator routes
    if (path.startsWith("/dashboard/creator")) {
      if (token?.role !== "CREATOR" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/shop/edit/:path*",
    "/shop/register",
    "/creator/register",
  ],
};