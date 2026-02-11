// /src/app/api/subscription-plans/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Use raw query to avoid schema mismatch
    const packages = await prisma.$queryRawUnsafe<Array<any>>(`
      SELECT 
        id,
        name,
        COALESCE(price, price_monthly, 0) as price,
        COALESCE(period_days, 30) as "periodDays",
        token_amount as "tokenAmount",
        features,
        tier
      FROM subscription_packages
      WHERE COALESCE(is_active, true) = true
      ORDER BY COALESCE(price, price_monthly, 0) ASC;
    `);
    
    return NextResponse.json({ packages });
  } catch (err) {
    console.error('Error fetching subscription plans:', err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}