"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/test-final-query.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testFinalQuery() {
    try {
        // ทดสอบ query สุดท้ายที่ใช้ใน API
        console.log('=== Testing final API query ===');
        const result = await prisma.$queryRaw `
      WITH ranked_shops AS (
        SELECT DISTINCT ON (s.id)
          s.id, s.name, s.description, s.address, s."createdAt", s.image, s.lat, s.lng, s.is_mockup as "isMockup",
          COALESCE(sp.tier, 'FREE') as "subscriptionTier",
          CASE sp.tier
            WHEN 'PREMIUM' THEN 1
            WHEN 'PRO' THEN 2
            WHEN 'BASIC' THEN 3
            ELSE 4
          END as tier_rank
        FROM "Shop" s
        LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
          AND ss.status = 'ACTIVE' 
          AND ss.end_date > NOW()
        LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
        WHERE s.status = 'APPROVED'
        ORDER BY s.id, tier_rank ASC, ss.end_date DESC NULLS LAST
      )
      SELECT id, name, "subscriptionTier"
      FROM ranked_shops
      ORDER BY tier_rank ASC, "createdAt" DESC
      LIMIT 50
    `;
        console.log(`\nTotal shops returned: ${result.length}`);
        const grouped = result.reduce((acc, shop) => {
            const tier = shop.subscriptionTier || 'FREE';
            if (!acc[tier])
                acc[tier] = [];
            acc[tier].push(shop);
            return acc;
        }, {});
        console.log('\n=== Shops by tier ===');
        ['PREMIUM', 'PRO', 'BASIC', 'FREE'].forEach(tier => {
            if (grouped[tier]) {
                console.log(`\n${tier}: ${grouped[tier].length} shops`);
                grouped[tier].slice(0, 5).forEach((shop) => {
                    console.log(`  - ${shop.name}`);
                });
                if (grouped[tier].length > 5) {
                    console.log(`  ... and ${grouped[tier].length - 5} more`);
                }
            }
        });
        // ตรวจสอบว่าร้านที่มี multiple subs ถูกเลือก tier ที่ดีที่สุดหรือไม่
        console.log('\n=== Checking shops with multiple subscriptions ===');
        const shopNames = [
            'เบเกอรี่อบสดประชาอุทิศ',
            'สเต๊กพรีเมียม',
            'ครัวอาหารใต้บางปลากด',
            'ร้านก๋วยเตี๋ยวเรือสมุทรปราการ'
        ];
        for (const name of shopNames) {
            const shop = result.find((s) => s.name === name);
            if (shop) {
                console.log(`✓ ${name}: ${shop.subscriptionTier}`);
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testFinalQuery();
