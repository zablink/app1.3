import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Checking shop table name and adding location columns...');
  
  try {
    // First, check what the actual table name is
    const tables = await prisma.$queryRawUnsafe<Array<{tablename: string}>>(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename ILIKE '%shop%'
      ORDER BY tablename;
    `);
    
    console.log('Found tables:', tables.map(t => t.tablename).join(', '));
    
    // Try common variations
    const possibleNames = ['Shop', 'shops', 'shop'];
    
    for (const tableName of possibleNames) {
      try {
        // Check if table exists
        const exists = await prisma.$queryRawUnsafe<Array<{exists: boolean}>>(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (exists[0]?.exists) {
          console.log(`✅ Found table: ${tableName}`);
          
          // Add lat column if not exists
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
          `);
          console.log('✅ Added lat column');

          // Add lng column if not exists
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
          `);
          console.log('✅ Added lng column');

          // Add image column if not exists
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN IF NOT EXISTS image TEXT;
          `);
          console.log('✅ Added image column');
          
          console.log('✨ Shop location columns updated successfully!');
          return;
        }
      } catch (e) {
        // Try next name
        continue;
      }
    }
    
    console.error('❌ Could not find shop table with any common name');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
