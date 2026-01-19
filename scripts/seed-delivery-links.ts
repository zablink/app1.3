// scripts/seed-delivery-links.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding mockup delivery links to shops...');

  // Get all shops
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true
    }
  });

  console.log(`Found ${shops.length} shops`);

  // Update each shop with mockup delivery links
  for (const shop of shops) {
    const shopNameEncoded = encodeURIComponent(shop.name);
    
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        lineManUrl: `https://lineman.line.me/store/${shop.id}`,
        grabFoodUrl: `https://food.grab.com/th/th/restaurant/${shop.name.toLowerCase().replace(/\s+/g, '-')}/${shop.id}`,
        foodPandaUrl: `https://www.foodpanda.co.th/restaurant/${shop.id}/${shop.name.toLowerCase().replace(/\s+/g, '-')}`,
        shopeeUrl: Math.random() > 0.5 ? `https://shopee.co.th/shop/${shop.id}` : null // 50% shops have Shopee
      }
    });

    console.log(`✅ Updated: ${shop.name}`);
  }

  console.log('\n✨ Done! All shops now have delivery links.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
