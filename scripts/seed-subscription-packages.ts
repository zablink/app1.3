import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking subscription packages...');
  
  try {
    // Check if packages exist
    const packages = await prisma.subscriptionPackage.findMany();
    console.log(`Found ${packages.length} package(s)`);
    
    if (packages.length > 0) {
      console.log('\nExisting packages:');
      packages.forEach(pkg => {
        console.log(`- ${pkg.name}: ฿${pkg.price} (${pkg.periodDays} days, ${pkg.tokenAmount || 0} tokens)`);
      });
      return;
    }
    
    // Create default packages if none exist
    console.log('\n📦 Creating default subscription packages...');
    
    const defaultPackages = [
      {
        name: 'Free',
        price: 0,
        periodDays: 30,
        tokenAmount: 0,
        features: 'Basic listing',
        tier: 'FREE' as const,
      },
      {
        name: 'Basic',
        price: 299,
        periodDays: 30,
        tokenAmount: 10,
        features: 'Priority listing, 10 tokens',
        tier: 'BASIC' as const,
      },
      {
        name: 'Pro',
        price: 599,
        periodDays: 30,
        tokenAmount: 25,
        features: 'Featured listing, 25 tokens, Analytics',
        tier: 'PRO' as const,
      },
      {
        name: 'Premium',
        price: 1299,
        periodDays: 30,
        tokenAmount: 60,
        features: 'Top placement, 60 tokens, Priority support',
        tier: 'PREMIUM' as const,
      },
    ];
    
    for (const pkg of defaultPackages) {
      const created = await prisma.subscriptionPackage.create({
        data: pkg,
      });
      console.log(`✅ Created: ${created.name} (฿${created.price})`);
    }
    
    console.log('\n✨ Default packages created successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
