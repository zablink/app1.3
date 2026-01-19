import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTokenTables() {
  try {
    // Check if token_wallets table exists
    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('token_wallets', 'token_purchases', 'token_usages');
    `);

    console.log('Token-related tables found:', tables.map(t => t.table_name));

    if (tables.some(t => t.table_name === 'token_wallets')) {
      console.log('\n✅ token_wallets exists, checking structure...');
      const columns = await prisma.$queryRawUnsafe<any[]>(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'token_wallets' 
        ORDER BY ordinal_position;
      `);
      console.log('Columns:', columns);
    } else {
      console.log('\n❌ token_wallets table does NOT exist');
      console.log('Creating token_wallets table...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS token_wallets (
          id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
          shop_id TEXT NOT NULL UNIQUE REFERENCES "Shop"(id) ON DELETE CASCADE,
          balance INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Created token_wallets table');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokenTables();
