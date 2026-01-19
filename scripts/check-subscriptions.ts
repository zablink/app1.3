// scripts/check-subscriptions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptions() {
  try {
    // ตรวจสอบจำนวน subscription ทั้งหมด
    const totalSubs = await prisma.shopSubscription.count();
    console.log('Total subscriptions:', totalSubs);

    // ตรวจสอบ subscription ที่ ACTIVE
    const activeSubs = await prisma.shopSubscription.count({
      where: { status: 'ACTIVE' }
    });
    console.log('Active subscriptions:', activeSubs);

    // ตรวจสอบ subscription แยกตาม tier
    const packages = await prisma.subscriptionPackage.findMany({
      include: {
        shop_subscriptions: {
          where: {
            status: 'ACTIVE',
            end_date: { gte: new Date() }
          }
        }
      }
    });

    console.log('\n=== Packages with active subscriptions ===');
    packages.forEach(pkg => {
      console.log(`- ${pkg.tier}: ${pkg.shop_subscriptions.length} active subs`);
    });

    // ตรวจสอบร้านค้าที่มี active subscription
    const shopsWithSubs: any = await prisma.$queryRaw`
      SELECT 
        s.id, s.name, sp.tier,
        ss.status, ss.start_date, ss.end_date
      FROM "Shop" s
      INNER JOIN shop_subscriptions ss ON s.id = ss.shop_id
      INNER JOIN subscription_packages sp ON ss.package_id = sp.id
      WHERE ss.status = 'ACTIVE'
        AND ss.end_date > NOW()
      ORDER BY 
        CASE sp.tier
          WHEN 'PREMIUM' THEN 1
          WHEN 'PRO' THEN 2
          WHEN 'BASIC' THEN 3
          ELSE 4
        END
      LIMIT 10
    `;

    console.log('\n=== Sample shops with active subscriptions ===');
    console.log(JSON.stringify(shopsWithSubs, null, 2));

    // ทดสอบ query เหมือน API (รุ่น 1 - มี DISTINCT ON)
    console.log('\n=== Testing API query with DISTINCT ON ===');
    const apiTestQuery: any = await prisma.$queryRaw`
      SELECT DISTINCT ON (s.id)
        s.id, s.name,
        COALESCE(sp.tier, 'FREE') as "subscriptionTier"
      FROM "Shop" s
      LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
        AND ss.status = 'ACTIVE' 
        AND ss.end_date > NOW()
      LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
      WHERE s.status = 'APPROVED'
      ORDER BY s.id,
        CASE sp.tier
          WHEN 'PREMIUM' THEN 1
          WHEN 'PRO' THEN 2
          WHEN 'BASIC' THEN 3
          ELSE 4
        END,
        s."createdAt" DESC
      LIMIT 50
    `;

    console.log('\n=== API Query Results (grouped by tier) ===');
    const grouped = apiTestQuery.reduce((acc: any, shop: any) => {
      const tier = shop.subscriptionTier || 'FREE';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(shop);
      return acc;
    }, {});

    Object.keys(grouped).sort().forEach(tier => {
      console.log(`\n${tier}: ${grouped[tier].length} shops`);
      grouped[tier].slice(0, 3).forEach((shop: any) => {
        console.log(`  - ${shop.name} (${shop.id})`);
      });
      if (grouped[tier].length > 3) {
        console.log(`  ... and ${grouped[tier].length - 3} more`);
      }
    });

    // ทดสอบ query ใหม่ที่แก้ไขแล้ว (ใช้ CTE กับ window function)
    console.log('\n\n=== Testing FIXED API query (with CTE) ===');
    const apiTestQuery3: any = await prisma.$queryRaw`
      WITH ranked_shops AS (
        SELECT DISTINCT ON (s.id)
          s.id, s.name,
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
      ORDER BY tier_rank ASC
      LIMIT 50
    `;

    const grouped3 = apiTestQuery3.reduce((acc: any, shop: any) => {
      const tier = shop.subscriptionTier || 'FREE';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(shop);
      return acc;
    }, {});

    Object.keys(grouped3).sort().forEach(tier => {
      console.log(`\n${tier}: ${grouped3[tier].length} shops`);
      grouped3[tier].slice(0, 3).forEach((shop: any) => {
        console.log(`  - ${shop.name} (${shop.id})`);
      });
      if (grouped3[tier].length > 3) {
        console.log(`  ... and ${grouped3[tier].length - 3} more`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();
