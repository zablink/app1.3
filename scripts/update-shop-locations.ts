// scripts/update-shop-locations.ts
// Update Shop records with province_id, amphure_id, tambon_id based on location geometry

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateShopLocations() {
  console.log('🔍 Starting shop location update...\n');

  try {
    // Get all shops that have location geometry but missing location IDs
    const shopsNeedUpdate = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      lat: number | null;
      lng: number | null;
    }>>`
      SELECT id, name, lat, lng
      FROM "Shop"
      WHERE lat IS NOT NULL AND lng IS NOT NULL
    `;

    console.log(`📊 Found ${shopsNeedUpdate.length} shops to update\n`);

    if (shopsNeedUpdate.length === 0) {
      console.log('✅ All shops already have location data');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const shop of shopsNeedUpdate) {
      try {
        if (!shop.lat || !shop.lng) {
          console.log(`⚠️  ${shop.name}: Missing lat/lng`);
          failCount++;
          continue;
        }
        
        // Ignore invalid/default coordinates
        if (shop.lat === 0 && shop.lng === 0) {
          console.log(`⚠️  ${shop.name}: Default coordinates (0,0) - skipping`);
          failCount++;
          continue;
        }
        
        // Check if within Thailand boundaries (approximate)
        if (shop.lat < 5.5 || shop.lat > 21 || shop.lng < 97 || shop.lng > 106) {
          console.log(`⚠️  ${shop.name}: Outside Thailand (${shop.lat}, ${shop.lng}) - skipping`);
          failCount++;
          continue;
        }

        // Find location IDs using ST_Contains on tambon, then get province/amphure via relations
        const locationData = await prisma.$queryRaw<Array<{
          tambon_id: number | null;
          amphure_id: number | null;
          province_id: number | null;
        }>>`
          SELECT 
            t.id as tambon_id,
            t.amphure_id as amphure_id,
            a.province_id as province_id
          FROM loc_tambons t
          LEFT JOIN loc_amphures a ON t.amphure_id = a.id
          WHERE ST_Contains(t.geom, ST_SetSRID(ST_MakePoint(${shop.lng}, ${shop.lat}), 4326))
          LIMIT 1
        `;

        if (locationData && locationData.length > 0) {
          const { tambon_id, amphure_id, province_id } = locationData[0];

          // Update shop with location IDs
          await prisma.shop.update({
            where: { id: shop.id },
            data: {
              tambon_id: tambon_id || undefined,
              amphure_id: amphure_id || undefined,
              province_id: province_id || undefined,
            },
          });

          console.log(`✅ ${shop.name}: Updated (P:${province_id}, A:${amphure_id}, T:${tambon_id})`);
          successCount++;
        } else {
          console.log(`⚠️  ${shop.name}: Location not found in geometry data`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ ${shop.name}: Error -`, error instanceof Error ? error.message : error);
        failCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${shopsNeedUpdate.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateShopLocations()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
