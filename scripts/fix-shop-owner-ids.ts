// scripts/fix-shop-owner-ids.ts
import { prisma } from '../src/lib/prisma';

async function fixShopOwnerIds() {
  console.log('Checking Shop owner IDs...\n');

  // Get all shops
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  console.log(`Total shops: ${shops.length}`);

  // Get all user IDs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userIds = new Set(users.map(u => u.id));
  console.log(`Total users: ${users.length}\n`);

  // Find shops with invalid owner IDs
  const invalidShops = shops.filter(shop => !userIds.has(shop.ownerId));

  if (invalidShops.length === 0) {
    console.log('✅ All shops have valid owner IDs!');
    return;
  }

  console.log(`❌ Found ${invalidShops.length} shops with invalid owner IDs:\n`);
  
  invalidShops.forEach(shop => {
    console.log(`- Shop: ${shop.name} (ID: ${shop.id})`);
    console.log(`  Invalid ownerId: ${shop.ownerId}\n`);
  });

  // Get first admin or user to assign as default owner
  const defaultOwner = users.find(u => u.email) || users[0];

  if (!defaultOwner) {
    console.log('❌ No users found to assign as default owner!');
    return;
  }

  console.log(`\nAssigning all invalid shops to: ${defaultOwner.name || defaultOwner.email} (${defaultOwner.id})`);

  // Update all invalid shops
  const result = await prisma.shop.updateMany({
    where: {
      id: {
        in: invalidShops.map(s => s.id),
      },
    },
    data: {
      ownerId: defaultOwner.id,
    },
  });

  console.log(`\n✅ Updated ${result.count} shops with valid owner ID`);
}

fixShopOwnerIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
