"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔍 Checking subscription packages...');
    try {
        // Use raw query to check existing data
        const packages = await prisma.$queryRawUnsafe(`
      SELECT * FROM subscription_packages;
    `);
        console.log(`Found ${packages.length} package(s)`);
        if (packages.length > 0) {
            console.log('\nExisting packages:');
            packages.forEach(pkg => {
                console.log(`- ${pkg.name}: ฿${pkg.price || pkg.price_monthly || 0}`);
            });
            console.log('\n✅ Packages already exist!');
            return;
        }
        // Create default packages using raw SQL
        console.log('\n📦 Creating default subscription packages...');
        const defaultPackages = [
            { name: 'Free', price: 0, period_days: 30, token_amount: 0, features: 'Basic listing', tier: 'FREE' },
            { name: 'Basic', price: 299, period_days: 30, token_amount: 10, features: 'Priority listing, 10 tokens', tier: 'BASIC' },
            { name: 'Pro', price: 599, period_days: 30, token_amount: 25, features: 'Featured listing, 25 tokens, Analytics', tier: 'PRO' },
            { name: 'Premium', price: 1299, period_days: 30, token_amount: 60, features: 'Top placement, 60 tokens, Priority support', tier: 'PREMIUM' },
        ];
        for (const pkg of defaultPackages) {
            await prisma.$executeRawUnsafe(`
        INSERT INTO subscription_packages (id, name, price, period_days, token_amount, features, tier, created_at, updated_at)
        VALUES (
          '${Math.random().toString(36).substring(2, 15)}',
          '${pkg.name}',
          ${pkg.price},
          ${pkg.period_days},
          ${pkg.token_amount},
          '${pkg.features}',
          '${pkg.tier}',
          NOW(),
          NOW()
        );
      `);
            console.log(`✅ Created: ${pkg.name} (฿${pkg.price})`);
        }
        console.log('\n✨ Default packages created successfully!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
