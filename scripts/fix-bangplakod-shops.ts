// scripts/fix-bangplakod-shops.ts
// Update shops with "กระทิงแดง" or "บางปลากด" to correct location

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBangplakodShops() {
  console.log('🔧 Fixing shops in ตำบลในคลองบางปลากด...\n');

  try {
    // 1. Find the correct tambon ID for "ในคลองบางปลากด"
    const tambon = await prisma.$queryRaw<Array<{
      id: number;
      name_th: string;
      amphure_id: number;
      amphure_name: string;
      province_id: number;
      province_name: string;
    }>>`
      SELECT 
        t.id,
        t.name_th,
        a.id as amphure_id,
        a.name_th as amphure_name,
        p.id as province_id,
        p.name_th as province_name
      FROM loc_tambons t
      LEFT JOIN loc_amphures a ON t.amphure_id = a.id
      LEFT JOIN loc_provinces p ON a.province_id = p.id
      WHERE t.name_th LIKE '%ในคลองบางปลากด%'
        AND a.name_th LIKE '%พระสมุทรเจดีย์%'
        AND p.name_th LIKE '%สมุทรปราการ%'
      LIMIT 1
    `;

    if (!tambon || tambon.length === 0) {
      console.log('❌ ไม่พบตำบล "ในคลองบางปลากด" ในฐานข้อมูล');
      return;
    }

    const targetTambon = tambon[0];
    console.log('✅ Found tambon:');
    console.log(`   ID: ${targetTambon.id}`);
    console.log(`   ตำบล: ${targetTambon.name_th}`);
    console.log(`   อำเภอ: ${targetTambon.amphure_name} (ID: ${targetTambon.amphure_id})`);
    console.log(`   จังหวัด: ${targetTambon.province_name} (ID: ${targetTambon.province_id})\n`);

    // 2. Get a sample point from the tambon geometry (centroid)
    const centroid = await prisma.$queryRaw<Array<{
      lat: number;
      lng: number;
    }>>`
      SELECT 
        ST_Y(ST_Centroid(geom)) as lat,
        ST_X(ST_Centroid(geom)) as lng
      FROM loc_tambons
      WHERE id = ${targetTambon.id}
    `;

    if (!centroid || centroid.length === 0) {
      console.log('❌ ไม่สามารถหาพิกัดของตำบลได้');
      return;
    }

    const { lat, lng } = centroid[0];
    console.log(`📍 Centroid coordinates: (${lat.toFixed(6)}, ${lng.toFixed(6)})\n`);

    // 3. Find shops with "กระทิงแดง" or "บางปลากด" in name
    const shopsToUpdate = await prisma.shop.findMany({
      where: {
        OR: [
          { name: { contains: 'กระทิงแดง' } },
          { name: { contains: 'บางปลากด' } },
        ],
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        province_id: true,
        amphure_id: true,
        tambon_id: true,
      },
    });

    console.log(`🔍 Found ${shopsToUpdate.length} shops to update:\n`);

    if (shopsToUpdate.length === 0) {
      console.log('✅ No shops found matching criteria');
      return;
    }

    // 4. Update each shop
    let successCount = 0;
    for (const shop of shopsToUpdate) {
      try {
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            lat: lat,
            lng: lng,
            tambon_id: targetTambon.id,
            amphure_id: targetTambon.amphure_id,
            province_id: targetTambon.province_id,
          },
        });

        console.log(`✅ ${shop.name}`);
        console.log(`   Old: (${shop.lat || 'null'}, ${shop.lng || 'null'})`);
        console.log(`   New: (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
        console.log(`   → ${targetTambon.province_name} > ${targetTambon.amphure_name} > ${targetTambon.name_th}\n`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ ${shop.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`✅ Updated: ${successCount}/${shopsToUpdate.length} shops`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixBangplakodShops()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
