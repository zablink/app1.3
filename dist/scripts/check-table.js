"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/check-table.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔧 Checking shop_subscriptions table...');
    const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_subscriptions';
  `);
    console.log('Columns:', columns.map(c => c.column_name).join(', '));
    const hasColumn = columns.some(c => c.column_name === 'plan_id');
    console.log('Has plan_id:', hasColumn);
    if (!hasColumn) {
        console.log('Adding plan_id column...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE shop_subscriptions ADD COLUMN plan_id TEXT;
    `);
        console.log('✅ Done!');
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
