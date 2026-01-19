// scripts/test-categories-count.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCategoriesCount() {
  try {
    console.log('=== Testing Categories Count ===\n');

    // ทดสอบ query แบบเดียวกับที่ใช้ใน API
    const categories = await prisma.shopCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: {
          select: {
            shops: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`พบ ${categories.length} หมวดหมู่\n`);

    // แสดงผลลัพธ์
    categories.forEach((cat) => {
      const icon = cat.icon || '🏪';
      const count = cat._count.shops;
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`${icon} ${cat.name.padEnd(30)} ${count.toString().padStart(3)} ร้าน ${bar}`);
    });

    // สรุป
    const totalShopRelations = categories.reduce((sum, cat) => sum + cat._count.shops, 0);
    const categoriesWithShops = categories.filter(cat => cat._count.shops > 0).length;
    const categoriesWithoutShops = categories.filter(cat => cat._count.shops === 0).length;

    console.log('\n=== สรุป ===');
    console.log(`หมวดหมู่ทั้งหมด: ${categories.length}`);
    console.log(`หมวดหมู่ที่มีร้าน: ${categoriesWithShops}`);
    console.log(`หมวดหมู่ที่ไม่มีร้าน: ${categoriesWithoutShops}`);
    console.log(`จำนวนความสัมพันธ์ร้าน-หมวดหมู่: ${totalShopRelations}`);

    // ตรวจสอบ many-to-many mapping
    console.log('\n=== ตัวอย่างร้านที่มีหลายหมวดหมู่ ===');
    const shopsWithMultipleCategories: any = await prisma.$queryRaw`
      SELECT s.id, s.name, COUNT(scm.category_id) as category_count,
        ARRAY_AGG(sc.name) as category_names
      FROM "Shop" s
      INNER JOIN shop_category_mapping scm ON s.id = scm.shop_id
      INNER JOIN "ShopCategory" sc ON scm.category_id = sc.id
      GROUP BY s.id, s.name
      HAVING COUNT(scm.category_id) > 1
      ORDER BY category_count DESC
      LIMIT 5
    `;

    if (shopsWithMultipleCategories.length > 0) {
      shopsWithMultipleCategories.forEach((shop: any) => {
        console.log(`\n${shop.name} (${shop.category_count} หมวดหมู่):`);
        shop.category_names.forEach((catName: string) => {
          console.log(`  - ${catName}`);
        });
      });
    } else {
      console.log('ไม่มีร้านที่มีหลายหมวดหมู่');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoriesCount();
