import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Disabling overlay for all existing banners...');
  
  const result = await prisma.heroBanner.updateMany({
    data: {
      enableOverlay: false
    }
  });
  
  console.log(`✅ Updated ${result.count} banner(s) - overlay disabled`);
  console.log('✨ All banners will now show clear images without overlay!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
