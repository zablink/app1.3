// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear data ก่อน (ใช้เฉพาะตอน dev)
  await prisma.analytics.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.shopCategory.deleteMany();
  await prisma.adPackage.deleteMany();
  await prisma.user.deleteMany();

  // สร้าง User เจ้าของร้าน (จำลอง)
  const owner = await prisma.user.create({
    data: {
      name: "Demo Shop Owner",
      email: "owner@example.com",
      role: "SHOP",
    },
  });

  // Categories
  const categories = await prisma.$transaction([
    prisma.shopCategory.create({ data: { name: "อาหารตามสั่ง" } }),
    prisma.shopCategory.create({ data: { name: "ก๋วยเตี๋ยว" } }),
    prisma.shopCategory.create({ data: { name: "เครื่องดื่ม" } }),
    prisma.shopCategory.create({ data: { name: "เบเกอรี่" } }),
  ]);

  // Ad Packages
  const packages = await prisma.$transaction([
    prisma.adPackage.create({
      data: { name: "Free", scope: "SUBDISTRICT", priority: 1, price: 0 },
    }),
    prisma.adPackage.create({
      data: { name: "Pro1", scope: "DISTRICT", priority: 2, price: 299 },
    }),
    prisma.adPackage.create({
      data: { name: "Pro2", scope: "PROVINCE", priority: 3, price: 599 },
    }),
    prisma.adPackage.create({
      data: { name: "Pro3", scope: "NATIONWIDE", priority: 4, price: 999 },
    }),
    prisma.adPackage.create({
      data: { name: "Special", scope: "NATIONWIDE", priority: 5, price: 0 },
    }),
  ]);

  // สร้างร้าน 20 ร้าน
  const shopNames = [
    "ครัวคุณแม่", "ก๋วยเตี๋ยวเรือบางกอก", "กาแฟสดหอมกรุ่น", "เค้กบ้านหวาน",
    "ตามสั่งป้าแดง", "ก๋วยเตี๋ยวต้มยำ", "ชาไข่มุกดุดุ", "Bakery Bliss",
    "ครัวริมทาง", "บะหมี่เกี๊ยวโกฮับ", "Smoothie Station", "ขนมปังอบใหม่",
    "Fast Rice Express", "ก๋วยเตี๋ยวหมูน้ำตก", "Coffee Corner", "Sweet & Soft",
    "Foodie Town", "Noodle Hub", "Tea Time", "Brownie House"
  ];

  const shops = [];

  for (let i = 0; i < shopNames.length; i++) {
    const category = categories[i % categories.length];
    const adPackage = packages[i % packages.length];

    const shop = await prisma.shop.create({
      data: {
        name: shopNames[i],
        description: `ร้าน ${shopNames[i]} อร่อยเด็ดในย่านนี้`,
        address: `123/45 ถนนหลัก เขตตัวเมือง จังหวัดกรุงเทพฯ`,
        lat: 13.7563 + Math.random() * 0.01,
        lng: 100.5018 + Math.random() * 0.01,
        ownerId: owner.id,
        categoryId: category.id,
        adPackageId: adPackage.id,
        image: `https://placehold.co/600x400?text=${encodeURIComponent(shopNames[i])}`,
      },
    });

    // ใส่เมนูให้แต่ละร้าน
    await prisma.menu.createMany({
      data: [
        {
          name: "เมนู Signature",
          price: 50 + Math.floor(Math.random() * 50),
          image: "https://placehold.co/400x300?text=Signature",
          shopId: shop.id,
        },
        {
          name: "เมนูแนะนำ",
          price: 40 + Math.floor(Math.random() * 40),
          image: "https://placehold.co/400x300?text=Recommended",
          shopId: shop.id,
        },
      ],
    });

    shops.push(shop);
  }

  console.log(`✅ Seeding เสร็จแล้ว: ${shops.length} ร้าน`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
