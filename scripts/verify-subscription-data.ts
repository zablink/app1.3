// scripts/verify-subscription-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    // นับร้านค้าที่ APPROVED
    const approvedShops = await prisma.shop.count({
      where: { status: 'APPROVED' }
    });
    console.log('Total APPROVED shops:', approvedShops);

    // นับ subscription ที่ active แต่ละ tier
    const activeSubsByTier: any = await prisma.$queryRaw`
      SELECT sp.tier, COUNT(DISTINCT ss.shop_id) as shop_count
      FROM shop_subscriptions ss
      INNER JOIN subscription_packages sp ON ss.package_id = sp.id
      INNER JOIN "Shop" s ON ss.shop_id = s.id
      WHERE ss.status = 'ACTIVE'
        AND ss.end_date > NOW()
        AND s.status = 'APPROVED'
      GROUP BY sp.tier
      ORDER BY 
        CASE sp.tier
          WHEN 'PREMIUM' THEN 1
          WHEN 'PRO' THEN 2
          WHEN 'BASIC' THEN 3
          ELSE 4
        END
    `;

    console.log('\n=== Active subscriptions by tier (APPROVED shops only) ===');
    activeSubsByTier.forEach((row: any) => {
      console.log(`${row.tier}: ${row.shop_count} shops`);
    });

    // หาร้านที่มี subscription มากกว่า 1 package
    const multiSubs: any = await prisma.$queryRaw`
      SELECT s.id, s.name, COUNT(*) as sub_count,
        ARRAY_AGG(sp.tier ORDER BY 
          CASE sp.tier
            WHEN 'PREMIUM' THEN 1
            WHEN 'PRO' THEN 2
            WHEN 'BASIC' THEN 3
            ELSE 4
          END
        ) as tiers
      FROM "Shop" s
      INNER JOIN shop_subscriptions ss ON s.id = ss.shop_id
      INNER JOIN subscription_packages sp ON ss.package_id = sp.id
      WHERE ss.status = 'ACTIVE'
        AND ss.end_date > NOW()
        AND s.status = 'APPROVED'
      GROUP BY s.id, s.name
      HAVING COUNT(*) > 1
      ORDER BY sub_count DESC
    `;

    if (multiSubs.length > 0) {
      console.log('\n=== Shops with multiple active subscriptions ===');
      multiSubs.forEach((row: any) => {
        console.log(`${row.name}: ${row.sub_count} subscriptions - ${row.tiers.join(', ')}`);
      });
    } else {
      console.log('\n✓ No shops have multiple active subscriptions');
    }

    // ร้านค้าที่ไม่มี subscription (FREE)
    const freeShops: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Shop" s
      WHERE s.status = 'APPROVED'
        AND NOT EXISTS (
          SELECT 1 FROM shop_subscriptions ss
          WHERE ss.shop_id = s.id
            AND ss.status = 'ACTIVE'
            AND ss.end_date > NOW()
        )
    `;

    console.log(`\nFREE tier shops (no active subscription): ${freeShops[0].count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
