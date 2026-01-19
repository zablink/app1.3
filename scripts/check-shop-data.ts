// Check shop location data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShopData() {
  // Check shop IDs and location data
  const shops = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    province_id: number | null;
    amphure_id: number | null;
    tambon_id: number | null;
    lat: number | null;
    lng: number | null;
  }>>`
    SELECT id, name, province_id, amphure_id, tambon_id, lat, lng
    FROM "Shop"
    LIMIT 5
  `;

  console.log('📊 Sample Shop Data:\n');
  shops.forEach(shop => {
    console.log(`ID: ${shop.id}`);
    console.log(`Name: ${shop.name}`);
    console.log(`Province ID: ${shop.province_id}`);
    console.log(`Amphure ID: ${shop.amphure_id}`);
    console.log(`Tambon ID: ${shop.tambon_id}`);
    console.log(`Lat/Lng: ${shop.lat}, ${shop.lng}`);
    console.log('---');
  });

  // Check if we can get names from location tables
  const shopWithLocation = await prisma.$queryRaw<Array<{
    shop_id: string;
    shop_name: string;
    province: string | null;
    district: string | null;
    subdistrict: string | null;
  }>>`
    SELECT 
      s.id as shop_id,
      s.name as shop_name,
      p.name_th as province,
      a.name_th as district,
      t.name_th as subdistrict
    FROM "Shop" s
    LEFT JOIN th_provinces p ON s.province_id = p.id
    LEFT JOIN th_districts a ON s.amphure_id = a.id
    LEFT JOIN th_subdistricts t ON s.tambon_id = t.id
    LIMIT 5
  `;

  console.log('\n📍 Shop with Location Names:\n');
  shopWithLocation.forEach(shop => {
    console.log(`${shop.shop_name}:`);
    console.log(`  Province: ${shop.province || 'NULL'}`);
    console.log(`  District: ${shop.district || 'NULL'}`);
    console.log(`  Subdistrict: ${shop.subdistrict || 'NULL'}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkShopData();
