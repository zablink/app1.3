// scripts/test-latest-subscription.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLatestSubscription() {
  try {
    console.log('=== Testing Latest Subscription Selection ===\n');

    // ทดสอบร้านที่มี multiple subscriptions
    const testShops = [
      'เบเกอรี่อบสดประชาอุทิศ',
      'สเต๊กพรีเมียม',
      'ครัวอาหารใต้บางปลากด',
      'ร้านก๋วยเตี๋ยวเรือสมุทรปราการ'
    ];

    for (const shopName of testShops) {
      // ดึงข้อมูล subscription ทั้งหมดของร้าน
      const allSubs: any = await prisma.$queryRaw`
        SELECT s.name, sp.tier, ss.start_date, ss.created_at, ss.end_date
        FROM "Shop" s
        INNER JOIN shop_subscriptions ss ON s.id = ss.shop_id
        INNER JOIN subscription_packages sp ON ss.package_id = sp.id
        WHERE s.name = ${shopName}
          AND ss.status = 'ACTIVE'
          AND ss.end_date > NOW()
        ORDER BY ss.start_date DESC, ss.created_at DESC
      `;

      if (allSubs.length > 0) {
        console.log(`\n📦 ${shopName}`);
        console.log(`   มี ${allSubs.length} subscription(s):`);
        allSubs.forEach((sub: any, i: number) => {
          const isLatest = i === 0 ? '← ล่าสุด ✅' : '';
          console.log(`   ${i + 1}. ${sub.tier} (start: ${sub.start_date.toISOString().split('T')[0]}) ${isLatest}`);
        });
      }
    }

    // ทดสอบ query ที่ใช้ใน API (เลือก subscription ล่าสุด)
    console.log('\n\n=== Testing API Query (Latest Subscription) ===\n');
    const apiResult: any = await prisma.$queryRaw`
      WITH ranked_shops AS (
        SELECT DISTINCT ON (s.id)
          s.id, s.name,
          COALESCE(sp.tier, 'FREE') as "subscriptionTier",
          ss.start_date, ss.created_at,
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
          AND s.name = ANY(ARRAY[
            'เบเกอรี่อบสดประชาอุทิศ',
            'สเต๊กพรีเมียม',
            'ครัวอาหารใต้บางปลากด',
            'ร้านก๋วยเตี๋ยวเรือสมุทรปราการ'
          ])
        ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
      )
      SELECT name, "subscriptionTier", start_date
      FROM ranked_shops
      ORDER BY name
    `;

    console.log('ผลลัพธ์จาก API (subscription ที่ถูกเลือก):');
    apiResult.forEach((shop: any) => {
      const dateStr = shop.start_date ? shop.start_date.toISOString().split('T')[0] : 'N/A';
      console.log(`  ✓ ${shop.name}: ${shop.subscriptionTier} (start: ${dateStr})`);
    });

    // ทดสอบ query แบบเก่า (เลือก tier ดีสุด) เพื่อเปรียบเทียบ
    console.log('\n\n=== Comparison: Old Method (Best Tier) ===\n');
    const oldResult: any = await prisma.$queryRaw`
      WITH ranked_shops AS (
        SELECT DISTINCT ON (s.id)
          s.id, s.name,
          COALESCE(sp.tier, 'FREE') as "subscriptionTier",
          ss.start_date,
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
          AND s.name = ANY(ARRAY[
            'เบเกอรี่อบสดประชาอุทิศ',
            'สเต๊กพรีเมียม',
            'ครัวอาหารใต้บางปลากด',
            'ร้านก๋วยเตี๋ยวเรือสมุทรปราการ'
          ])
        ORDER BY s.id, tier_rank ASC, ss.end_date DESC NULLS LAST
      )
      SELECT name, "subscriptionTier", start_date
      FROM ranked_shops
      ORDER BY name
    `;

    console.log('วิธีเก่า (เลือก tier ดีสุด):');
    oldResult.forEach((shop: any) => {
      const dateStr = shop.start_date ? shop.start_date.toISOString().split('T')[0] : 'N/A';
      console.log(`  × ${shop.name}: ${shop.subscriptionTier} (start: ${dateStr})`);
    });

    // สรุปความแตกต่าง
    console.log('\n\n=== Summary ===');
    apiResult.forEach((newShop: any) => {
      const oldShop = oldResult.find((s: any) => s.name === newShop.name);
      if (oldShop && oldShop.subscriptionTier !== newShop.subscriptionTier) {
        console.log(`⚠️  ${newShop.name}:`);
        console.log(`    วิธีเก่า (tier ดีสุด): ${oldShop.subscriptionTier}`);
        console.log(`    วิธีใหม่ (ล่าสุด): ${newShop.subscriptionTier} ✅`);
      } else if (oldShop) {
        console.log(`✓  ${newShop.name}: ${newShop.subscriptionTier} (ไม่เปลี่ยนแปลง)`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLatestSubscription();
