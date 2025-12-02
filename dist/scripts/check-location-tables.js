"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Check location table structure
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkTables() {
    const tables = ['loc_provinces', 'loc_amphures', 'loc_tambons'];
    for (const table of tables) {
        console.log(`\n📋 Table: ${table}`);
        const columns = await prisma.$queryRawUnsafe(`
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
