"use strict";
// scripts/update-hero-banners.ts
// เพิ่ม enable_overlay และ link columns
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔧 Updating hero_banners table...\n');
    try {
        // เพิ่ม enable_overlay column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE hero_banners 
      ADD COLUMN IF NOT EXISTS enable_overlay BOOLEAN DEFAULT true;
    `);
        console.log('✅ Added enable_overlay column');
        // เพิ่ม link column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE hero_banners 
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);
        console.log('✅ Added link column');
        console.log('\n✨ Hero banners table updated successfully!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
