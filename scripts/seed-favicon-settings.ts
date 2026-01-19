// scripts/seed-favicon-settings.ts
// Seed script to add favicon settings to site_settings table

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding favicon settings...');

  const faviconSettings = [
    // Favicon พื้นฐาน
    {
      key: 'site_favicon_16',
      value: '/favicon-16x16.png',
      category: 'branding',
      dataType: 'image',
      label: 'Favicon 16x16',
      description: 'ไอคอนสำหรับแท็บเบราว์เซอร์ (16x16 พิกเซล)',
    },
    {
      key: 'site_favicon_32',
      value: '/favicon-32x32.png',
      category: 'branding',
      dataType: 'image',
      label: 'Favicon 32x32',
      description: 'ไอคอนสำหรับแท็บเบราว์เซอร์ (32x32 พิกเซล)',
    },
    
    // Apple Touch Icon
    {
      key: 'site_apple_touch_icon',
      value: '/apple-touch-icon.png',
      category: 'branding',
      dataType: 'image',
      label: 'Apple Touch Icon',
      description: 'ไอคอนสำหรับอุปกรณ์ Apple (180x180 พิกเซล)',
    },
    
    // PWA Icons
    {
      key: 'site_icon_192',
      value: '/icon-192x192.png',
      category: 'branding',
      dataType: 'image',
      label: 'PWA Icon 192x192',
      description: 'ไอคอนสำหรับ Progressive Web App (192x192 พิกเซล)',
    },
    {
      key: 'site_icon_512',
      value: '/icon-512x512.png',
      category: 'branding',
      dataType: 'image',
      label: 'PWA Icon 512x512',
      description: 'ไอคอนสำหรับ Progressive Web App (512x512 พิกเซล)',
    },
    
    // Web App Manifest
    {
      key: 'site_manifest_json',
      value: '/site.webmanifest',
      category: 'branding',
      dataType: 'string',
      label: 'Web App Manifest',
      description: 'URL ของไฟล์ manifest.json',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const setting of faviconSettings) {
    try {
      // ตรวจสอบว่ามีอยู่แล้วหรือไม่
      const existing = await prisma.siteSetting.findUnique({
        where: { key: setting.key },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${setting.key} (already exists)`);
        skippedCount++;
        continue;
      }

      // สร้างใหม่
      await prisma.siteSetting.create({
        data: setting,
      });

      console.log(`✅ Created: ${setting.key}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating ${setting.key}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📦 Total: ${faviconSettings.length}`);
  console.log('\n🎉 Favicon settings seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding favicon settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
