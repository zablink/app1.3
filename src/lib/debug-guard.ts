import { NextResponse } from "next/server";

type RequestLike = { headers: Headers };

export function debugGuard(req: RequestLike) {
  if (process.env.NODE_ENV !== "production") return null;

  const secret = process.env.DEBUG_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const provided = req.headers.get("x-debug-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return null;
}

