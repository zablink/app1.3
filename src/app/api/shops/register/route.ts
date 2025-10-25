// app/api/shops/register/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      categoryId,
      address,
      phone,
      email,
      website,
      lineId,
      hasPhysicalStore,
      showLocationOnMap,
      lat,
      lng,
      image,
    } = body;

    // Validation
    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "ชื่อร้านและประเภทเป็นข้อมูลที่จำเป็น" },
        { status: 400 }
      );
    }

    // Check if user already has a shop with this name
    const existingShop = await prisma.shop.findFirst({
      where: {
        ownerId: session.user.id,
        name,
      },
    });

    if (existingShop) {
      return NextResponse.json(
        { error: "คุณมีร้านชื่อนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        ownerId: session.user.id,
        name,
        description,
        categoryId,
        address,
        image,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        has_physical_store: hasPhysicalStore,
        show_location_on_map: showLocationOnMap,
      },
    });

    // Create shop links if provided
    const links = [];
    if (phone) links.push({ type: "phone", url: phone });
    if (email) links.push({ type: "email", url: email });
    if (website) links.push({ type: "website", url: website });
    if (lineId) links.push({ type: "line", url: lineId });

    if (links.length > 0) {
      await prisma.shop_links.createMany({
        data: links.map((link) => ({
          shop_id: shop.id,
          type: link.type,
          url: link.url,
        })),
      });
    }

    return NextResponse.json(
      {
        message: "สมัครร้านค้าสำเร็จ",
        shop: {
          id: shop.id,
          name: shop.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Shop registration error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสมัครร้านค้า" },
      { status: 500 }
    );
  }
}