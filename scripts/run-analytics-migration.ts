// Run analytics migration via Prisma
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Running analytics migration...');

    // Read the SQL migration file
    const sqlPath = path.join(
      process.cwd(),
      'prisma/migrations/create_analytics_system.sql'
    );
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments
    const cleanedSQL = sqlContent
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        return !trimmed.startsWith('--');
      })
      .join('\n');

    // Split SQL by semicolons, but preserve dollar-quoted functions
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;

    for (const line of cleanedSQL.split('\n')) {
      currentStatement += line + '\n';

      // Toggle dollar quote state
      if (line.includes('$$')) {
        inDollarQuote = !inDollarQuote;
      }

      // Check for semicolon (but not inside dollar quotes)
      if (line.trim().endsWith(';') && !inDollarQuote) {
        const trimmed = currentStatement.trim();
        if (trimmed) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let executed = 0;
    for (const statement of statements) {
      try {
        const preview = statement
          .substring(0, 80)
          .replace(/\s+/g, ' ')
          .replace(/\n/g, ' ');
        console.log(`[${++executed}/${statements.length}] ${preview}...`);
        await prisma.$executeRawUnsafe(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.code === 'P2010' &&
          (error.meta?.code === '42P07' || error.meta?.message?.includes('already exists'))
        ) {
          console.log(`  ⚠️  Already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Analytics tables created successfully!');

    // Verify tables exist
    const tables = await prisma.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('page_views', 'shop_views', 'user_sessions', 'events', 'conversion_funnel', 'daily_stats')
      ORDER BY table_name;
    `;

    console.log('\n📊 Created tables:');
    tables.forEach((t) => console.log(`  ✓ ${t.table_name}`));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
