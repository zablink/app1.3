// scripts/setup-og-campaign.ts
// Setup OG Campaign settings in SiteSetting

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupOGCampaign() {
  console.log('🎖️ Setting up OG Campaign settings...\n');

  const settings = [
    {
      key: 'og_campaign_enabled',
      value: 'true',
      dataType: 'boolean',
      category: 'campaign',
      label: 'OG Campaign Enabled',
      description: 'เปิด/ปิด OG Campaign',
    },
    {
      key: 'og_campaign_start_date',
      value: new Date('2025-01-01').toISOString(),
      dataType: 'string',
      category: 'campaign',
      label: 'OG Campaign Start Date',
      description: 'วันที่เริ่ม OG Campaign (ISO format)',
    },
    {
      key: 'og_campaign_end_date',
      value: new Date('2025-12-31T23:59:59.999Z').toISOString(),
      dataType: 'string',
      category: 'campaign',
      label: 'OG Campaign End Date',
      description: 'วันที่สิ้นสุด OG Campaign (ISO format)',
    },
    {
      key: 'og_benefits_duration_days',
      value: '730',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Benefits Duration (Days)',
      description: 'ระยะเวลาสิทธิพิเศษ OG (วัน) - default 730 วัน (2 ปี)',
    },
    {
      key: 'og_token_multiplier',
      value: '2.0',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Token Multiplier',
      description: 'ตัวคูณ Token สำหรับ OG (default: 2.0 = 2 เท่า)',
    },
    {
      key: 'og_usage_discount',
      value: '0.30',
      dataType: 'number',
      category: 'campaign',
      label: 'OG Usage Discount',
      description: 'ส่วนลดการใช้ Token สำหรับ OG (0-1, default: 0.30 = 30%)',
    },
  ];

  for (const setting of settings) {
    try {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          dataType: setting.dataType,
          category: setting.category,
          label: setting.label,
          description: setting.description,
        },
        create: setting,
      });
      console.log(`✅ ${setting.key}: ${setting.value}`);
    } catch (error) {
      console.error(`❌ Error setting ${setting.key}:`, error);
    }
  }

  console.log('\n✨ OG Campaign settings configured!');
  console.log('\n📝 Note: You can update these settings via Admin Panel at /admin/settings');
}

setupOGCampaign()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
