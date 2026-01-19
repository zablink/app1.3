// src/app/api/debug-session/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const headers = Object.fromEntries(request.headers);
    
    console.log("=== Debug Session API ===");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Cookie header:", headers.cookie?.substring(0, 100));
    
    const session = await getServerSession(authOptions);
    
    console.log("Session exists:", !!session);
    console.log("User ID:", session?.user?.id);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      config: {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      },
      
      cookies: {
        hasCookie: !!headers.cookie,
        hasSecureToken: headers.cookie?.includes("__Secure-next-auth.session-token"),
        hasRegularToken: headers.cookie?.includes("next-auth.session-token"),
      },
      
      session: {
        exists: !!session,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userRole: session?.user?.role || null,
      },
      
      authOptions: {
        hasSecret: !!authOptions.secret,
        secretMatches: authOptions.secret === process.env.NEXTAUTH_SECRET,
        hasCookies: !!authOptions.cookies,
        hasCallbacks: !!authOptions.callbacks,
      },
    });
  } catch (error: any) {
    console.error("Debug session error:", error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 }); 
  }
}
