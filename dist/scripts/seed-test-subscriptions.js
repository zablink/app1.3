"use strict";
// scripts/seed-test-subscriptions.ts
// Script to create test subscriptions for shops
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting to seed test subscriptions...');
    // Get all subscription packages using raw query
    const packages = await prisma.$queryRawUnsafe(`
    SELECT id, name, tier FROM subscription_packages ORDER BY tier DESC
  `);
    console.log('Found packages:', packages.map(p => ({ id: p.id, name: p.name, tier: p.tier })));
    const premiumPkg = packages.find(p => p.tier === 'PREMIUM');
    const proPkg = packages.find(p => p.tier === 'PRO');
    const basicPkg = packages.find(p => p.tier === 'BASIC');
    if (!premiumPkg || !proPkg || !basicPkg) {
        console.error('Missing subscription packages! Please create them first.');
        console.log('Available packages:', packages);
        return;
    }
    // Get all approved shops using raw query
    const shops = await prisma.$queryRawUnsafe(`
    SELECT id, name FROM "Shop" WHERE status = 'APPROVED' LIMIT 20
  `);
    console.log(`Found ${shops.length} approved shops`);
    if (shops.length === 0) {
        console.log('No approved shops found. Creating some...');
        return;
    }
    // Delete existing subscriptions first
    await prisma.$executeRaw `DELETE FROM shop_subscriptions WHERE shop_id IN (SELECT id FROM "Shop" LIMIT 20)`;
    console.log('Cleared existing subscriptions');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    // Assign subscriptions to shops
    const assignments = [
        // 6 Premium shops
        ...shops.slice(0, 6).map(shop => ({
            shopId: shop.id,
            planId: premiumPkg.id,
            tier: 'PREMIUM',
        })),
        // 3 Pro shops
        ...shops.slice(6, 9).map(shop => ({
            shopId: shop.id,
            planId: proPkg.id,
            tier: 'PRO',
        })),
        // 3 Basic shops
        ...shops.slice(9, 12).map(shop => ({
            shopId: shop.id,
            planId: basicPkg.id,
            tier: 'BASIC',
        })),
        // Rest are free (no subscription)
    ];
    console.log(`Creating ${assignments.length} subscriptions...`);
    for (const assignment of assignments) {
        const shop = shops.find(s => s.id === assignment.shopId);
        try {
            await prisma.$executeRawUnsafe(`
        INSERT INTO shop_subscriptions (
          id, shop_id, package_id, plan_id, status, start_date, end_date, 
          original_price, discount_amount, final_price, payment_status, auto_renew, 
          created_at, updated_at
        )
        VALUES (
          gen_random_uuid()::text,
          $1,
          $2,
          $2,
          'ACTIVE',
          $3,
          $4,
          0,
          0,
          0,
          'COMPLETED',
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `, assignment.shopId, assignment.planId, now, futureDate);
            console.log(`✓ Assigned ${assignment.tier} to shop: ${shop === null || shop === void 0 ? void 0 : shop.name}`);
        }
        catch (error) {
            console.error(`✗ Failed to assign ${assignment.tier} to shop: ${shop === null || shop === void 0 ? void 0 : shop.name}`, error);
        }
    }
    // Verify
    const result = await prisma.$queryRawUnsafe(`
    SELECT 
      s.name as shop_name,
      sp.tier,
      ss.status,
      ss.end_date
    FROM shop_subscriptions ss
    JOIN "Shop" s ON ss.shop_id = s.id
    JOIN subscription_packages sp ON ss.plan_id = sp.id
    WHERE ss.status = 'ACTIVE'
    ORDER BY sp.tier DESC, s.name
  `);
    console.log('\n=== Active Subscriptions ===');
    result.forEach(r => {
        console.log(`${r.tier.padEnd(10)} | ${r.shop_name.substring(0, 30).padEnd(30)} | ${r.status} | Expires: ${new Date(r.end_date).toLocaleDateString()}`);
    });
    console.log('\nDone! Created subscriptions for testing.');
}
main()
    .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
