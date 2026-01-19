// scripts/create-tables.ts
// สร้างตาราง site_settings และ hero_banners ถ้ายังไม่มี

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating tables if not exist...\n');

  try {
    // Drop existing tables to recreate with correct schema
    console.log('🗑️  Dropping existing tables...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS site_setting_history CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS site_settings CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS hero_banners CASCADE;`);
    console.log('✅ Tables dropped\n');

    // Create site_settings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE site_settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'string',
        label TEXT NOT NULL,
        description TEXT,
        updated_by TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table site_settings created');

    // Create site_setting_history table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE site_setting_history (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        setting_key TEXT NOT NULL,
        old_value TEXT NOT NULL,
        new_value TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (setting_key) REFERENCES site_settings(key) ON DELETE CASCADE
      );
    `);
    console.log('✅ Table site_setting_history created');

    // Create hero_banners table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE hero_banners (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        subtitle TEXT,
        cta_label TEXT,
        cta_link TEXT,
        image_url TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_date TIMESTAMP(3),
        end_date TIMESTAMP(3),
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table hero_banners created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_site_settings_category ON site_settings(category);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_site_settings_key ON site_settings(key);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_hero_banners_priority ON hero_banners(priority DESC);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_hero_banners_active ON hero_banners(is_active);
    `);
    console.log('✅ Indexes created');

    console.log('\n✨ All tables and indexes ready!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
