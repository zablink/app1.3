// Check location table structure
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  const tables = ['loc_provinces', 'loc_amphures', 'loc_tambons'];
  
  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${table}'
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  }
  
  await prisma.$disconnect();
}

checkTables();
