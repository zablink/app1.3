import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Checking subscription_packages table structure...');
  
  try {
    // Check table columns
    const columns = await prisma.$queryRawUnsafe<Array<{column_name: string, data_type: string}>>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'subscription_packages'
      ORDER BY ordinal_position;
    `);
    
    if (columns.length === 0) {
      console.log('❌ Table subscription_packages does not exist!');
      console.log('Creating table...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS subscription_packages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL DEFAULT 0,
          period_days INTEGER NOT NULL DEFAULT 30,
          token_amount INTEGER,
          features TEXT,
          tier TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log('✅ Table created!');
    } else {
      console.log('\nExisting columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Add missing columns
      const columnNames = columns.map(c => c.column_name);
      
      if (!columnNames.includes('price')) {
        console.log('\n➕ Adding price column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE subscription_packages 
          ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0;
        `);
        console.log('✅ Added price column');
      }
      
      if (!columnNames.includes('period_days')) {
        console.log('➕ Adding period_days column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE subscription_packages 
          ADD COLUMN IF NOT EXISTS period_days INTEGER NOT NULL DEFAULT 30;
        `);
        console.log('✅ Added period_days column');
      }
      
      if (!columnNames.includes('token_amount')) {
        console.log('➕ Adding token_amount column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE subscription_packages 
          ADD COLUMN IF NOT EXISTS token_amount INTEGER;
        `);
        console.log('✅ Added token_amount column');
      }
      
      if (!columnNames.includes('features')) {
        console.log('➕ Adding features column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE subscription_packages 
          ADD COLUMN IF NOT EXISTS features TEXT;
        `);
        console.log('✅ Added features column');
      }
      
      if (!columnNames.includes('tier')) {
        console.log('➕ Adding tier column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE subscription_packages 
          ADD COLUMN IF NOT EXISTS tier TEXT;
        `);
        console.log('✅ Added tier column');
      }
    }
    
    console.log('\n✨ Table structure updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
