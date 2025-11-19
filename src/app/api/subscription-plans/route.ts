// /src/app/api/subscription-plans/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscription_packages.findMany({
      orderBy: { price: "asc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}