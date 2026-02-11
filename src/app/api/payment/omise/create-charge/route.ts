// src/app/api/payment/omise/create-charge/route.ts
import { NextResponse } from "next/server";
import Omise from "omise";
import { requireOwnerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const omise = new Omise({ secretKey: process.env.OMISE_SECRET_KEY || "" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, amount, currency = "thb", description, returnUri, metadata } = body;
    if (!shopId || !amount) return NextResponse.json({ error: "shopId and amount required" }, { status: 400 });

    const authErr = await requireOwnerOrAdmin(req, shopId);
    if (authErr) return authErr;

    const charge = await omise.charges.create({
      amount: Math.round(amount * 100),
      currency,
      description,
      return_uri: returnUri,
      metadata: { shopId, ...metadata },
    });

    return NextResponse.json({ charge });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}