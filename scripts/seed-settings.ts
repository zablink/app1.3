// scripts/seed-settings.ts
// Run: npx tsx scripts/seed-settings.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding site settings...');

  const settings = [
    // ============================================
    // BRANDING (แบรนด์)
    // ============================================
    
    // Site Identity
    { key: 'site_name', value: 'Zablink', category: 'branding', dataType: 'string', label: 'ชื่อเว็บไซต์', description: 'ชื่อเว็บไซต์ที่แสดงในหัวข้อและโลโก้' },
    { key: 'site_tagline', value: 'ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', category: 'branding', dataType: 'string', label: 'คำขวัญ (Tagline)', description: 'คำอธิบายสั้นๆ เกี่ยวกับเว็บไซต์' },
    
    // Logos & Icons
    { key: 'site_logo', value: '/images/logo.png', category: 'branding', dataType: 'image', label: 'โลโก้หลัก', description: 'โลโก้ที่แสดงใน navbar และ footer' },
    { key: 'site_logo_dark', value: '/images/logo-dark.png', category: 'branding', dataType: 'image', label: 'โลโก้ (โหมดมืด)', description: 'โลโก้สำหรับ dark mode' },
    { key: 'site_favicon', value: '/favicon.ico', category: 'branding', dataType: 'image', label: 'Favicon', description: 'ไอคอนที่แสดงในแท็บเบราว์เซอร์' },
    { key: 'site_icon_192', value: '/images/icon-192.png', category: 'branding', dataType: 'image', label: 'App Icon 192x192', description: 'ไอคอนสำหรับ PWA และ mobile' },
    { key: 'site_icon_512', value: '/images/icon-512.png', category: 'branding', dataType: 'image', label: 'App Icon 512x512', description: 'ไอคอนขนาดใหญ่สำหรับ PWA' },
    
    // Brand Colors
    { key: 'brand_primary_color', value: '#ea580c', category: 'branding', dataType: 'color', label: 'สีหลัก (Primary)', description: 'สีหลักของแบรนด์ (Orange)' },
    { key: 'brand_secondary_color', value: '#dc2626', category: 'branding', dataType: 'color', label: 'สีรอง (Secondary)', description: 'สีรองของแบรนด์ (Red)' },
    { key: 'brand_accent_color', value: '#f97316', category: 'branding', dataType: 'color', label: 'สีเน้น (Accent)', description: 'สีเน้นสำหรับปุ่มและไฮไลท์' },
    
    // Social Media
    { key: 'social_facebook', value: 'https://facebook.com/zablink', category: 'branding', dataType: 'string', label: 'Facebook URL', description: 'ลิงก์ Facebook Page' },
    { key: 'social_instagram', value: 'https://instagram.com/zablink', category: 'branding', dataType: 'string', label: 'Instagram URL', description: 'ลิงก์ Instagram' },
    { key: 'social_twitter', value: 'https://twitter.com/zablink', category: 'branding', dataType: 'string', label: 'Twitter/X URL', description: 'ลิงก์ Twitter/X' },
    { key: 'social_line', value: '', category: 'branding', dataType: 'string', label: 'LINE ID', description: 'LINE Official Account ID' },
    { key: 'social_tiktok', value: '', category: 'branding', dataType: 'string', label: 'TikTok URL', description: 'ลิงก์ TikTok' },

    // ============================================
    // SEO
    // ============================================
    
    // Meta Tags
    { key: 'seo_title', value: 'Zablink - ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', category: 'seo', dataType: 'string', label: 'SEO Title', description: 'หัวข้อหลักสำหรับ search engines (50-60 ตัวอักษร)' },
    { key: 'seo_description', value: 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น พบร้านอาหารที่ดีที่สุดใกล้คุณ', category: 'seo', dataType: 'string', label: 'SEO Description', description: 'คำอธิบายสำหรับ search results (150-160 ตัวอักษร)' },
    { key: 'seo_keywords', value: 'ร้านอาหาร, รีวิวร้านอาหาร, โปรโมชั่น, แคมเปญ, influencer, creator', category: 'seo', dataType: 'string', label: 'Keywords', description: 'คำสำคัญสำหรับ SEO (คั่นด้วย comma)' },
    
    // Open Graph
    { key: 'og_title', value: 'Zablink - ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', category: 'seo', dataType: 'string', label: 'OG Title', description: 'หัวข้อสำหรับ social media sharing' },
    { key: 'og_description', value: 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น', category: 'seo', dataType: 'string', label: 'OG Description', description: 'คำอธิบายสำหรับ social sharing' },
    { key: 'og_image', value: '/images/og-image.jpg', category: 'seo', dataType: 'image', label: 'OG Image', description: 'รูปภาพสำหรับ social sharing (1200x630px)' },
    { key: 'og_type', value: 'website', category: 'seo', dataType: 'string', label: 'OG Type', description: 'ประเภทเว็บไซต์ (website, article, etc.)' },
    
    // Twitter Card
    { key: 'twitter_card', value: 'summary_large_image', category: 'seo', dataType: 'string', label: 'Twitter Card Type', description: 'ประเภท Twitter Card' },
    { key: 'twitter_site', value: '@zablink', category: 'seo', dataType: 'string', label: 'Twitter @username', description: 'Twitter username ของเว็บไซต์' },
    
    // Schema.org
    { key: 'schema_type', value: 'LocalBusiness', category: 'seo', dataType: 'string', label: 'Schema Type', description: 'ประเภท Schema.org (LocalBusiness, Restaurant)' },
    { key: 'robots_meta', value: 'index, follow', category: 'seo', dataType: 'string', label: 'Robots Meta Tag', description: 'คำสั่งสำหรับ search engine crawlers' },
    { key: 'canonical_url', value: 'https://zablink.com', category: 'seo', dataType: 'string', label: 'Canonical URL', description: 'URL หลักของเว็บไซต์' },

    // ============================================
    // SITE (การตั้งค่าเว็บไซต์)
    // ============================================
    
    // Contact Information
    { key: 'contact_email', value: 'contact@zablink.com', category: 'site', dataType: 'string', label: 'อีเมลติดต่อ', description: 'อีเมลสำหรับติดต่อ support' },
    { key: 'contact_phone', value: '02-xxx-xxxx', category: 'site', dataType: 'string', label: 'เบอร์โทรศัพท์', description: 'เบอร์โทรติดต่อ' },
    { key: 'contact_address', value: 'กรุงเทพมหานคร ประเทศไทย', category: 'site', dataType: 'string', label: 'ที่อยู่', description: 'ที่อยู่บริษัท/สำนักงาน' },
    { key: 'support_hours', value: 'จันทร์-ศุกร์ 9:00-18:00', category: 'site', dataType: 'string', label: 'เวลาทำการ', description: 'เวลาให้บริการ support' },
    
    // Timezone & Locale
    { key: 'site_timezone', value: 'Asia/Bangkok', category: 'site', dataType: 'string', label: 'Timezone', description: 'เขตเวลาของเว็บไซต์' },
    { key: 'site_locale', value: 'th-TH', category: 'site', dataType: 'string', label: 'Locale', description: 'ภาษาและรูปแบบการแสดงผล' },
    { key: 'site_currency', value: 'THB', category: 'site', dataType: 'string', label: 'สกุลเงิน', description: 'สกุลเงินที่ใช้ในระบบ' },
    
    // Legal Pages
    { key: 'privacy_policy_url', value: '/privacy', category: 'site', dataType: 'string', label: 'Privacy Policy URL', description: 'ลิงก์นโยบายความเป็นส่วนตัว' },
    { key: 'terms_of_service_url', value: '/terms', category: 'site', dataType: 'string', label: 'Terms of Service URL', description: 'ลิงก์เงื่อนไขการใช้งาน' },
    { key: 'cookie_policy_url', value: '/cookies', category: 'site', dataType: 'string', label: 'Cookie Policy URL', description: 'ลิงก์นโยบายคุกกี้' },
    
    // Footer
    { key: 'footer_copyright', value: '© 2024 Zablink. All rights reserved.', category: 'site', dataType: 'string', label: 'Copyright Text', description: 'ข้อความ copyright ใน footer' },
    { key: 'footer_description', value: 'แพลตฟอร์มค้นหาร้านอาหารและรีวิวที่ดีที่สุด เชื่อมต่อร้านอาหาร influencer และลูกค้า', category: 'site', dataType: 'string', label: 'Footer Description', description: 'คำอธิบายใน footer' },
    
    // Maintenance
    { key: 'maintenance_mode', value: 'false', category: 'site', dataType: 'boolean', label: 'โหมดปิดปรับปรุง', description: 'เปิดใช้งานหน้า maintenance' },
    { key: 'maintenance_message', value: 'ระบบอยู่ระหว่างปรับปรุง กรุณากลับมาใหม่ในภายหลัง', category: 'site', dataType: 'string', label: 'ข้อความ Maintenance', description: 'ข้อความแสดงเมื่อเปิด maintenance mode' },

    // ============================================
    // FEATURES (ฟีเจอร์)
    // ============================================
    
    // User Features
    { key: 'enable_user_registration', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิดการสมัครสมาชิก', description: 'อนุญาตให้ผู้ใช้สมัครสมาชิกใหม่' },
    { key: 'enable_social_login', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิด Social Login', description: 'อนุญาต login ด้วย Google, Facebook, etc.' },
    { key: 'enable_email_verification', value: 'true', category: 'features', dataType: 'boolean', label: 'ยืนยันอีเมล', description: 'ต้องยืนยันอีเมลก่อนใช้งาน' },
    
    // Review & Rating
    { key: 'enable_reviews', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิดรีวิว', description: 'อนุญาตให้ผู้ใช้เขียนรีวิว' },
    { key: 'enable_ratings', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิดให้คะแนน', description: 'อนุญาตให้ผู้ใช้ให้คะแนนร้านอาหาร' },
    { key: 'min_review_length', value: '10', category: 'features', dataType: 'string', label: 'ความยาวรีวิวขั้นต่ำ', description: 'จำนวนตัวอักษรขั้นต่ำของรีวิว' },
    { key: 'max_review_length', value: '2000', category: 'features', dataType: 'string', label: 'ความยาวรีวิวสูงสุด', description: 'จำนวนตัวอักษรสูงสุดของรีวิว' },
    { key: 'review_moderation', value: 'false', category: 'features', dataType: 'boolean', label: 'ตรวจสอบรีวิว', description: 'รีวิวต้องได้รับการอนุมัติก่อนแสดง' },
    
    // Bookmarks & Favorites
    { key: 'enable_bookmarks', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิด Bookmarks', description: 'อนุญาตให้ผู้ใช้บันทึกร้านโปรด' },
    { key: 'enable_favorites', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิด Favorites', description: 'อนุญาตให้ผู้ใช้ชอบร้านอาหาร' },
    
    // Search & Discovery
    { key: 'enable_location_search', value: 'true', category: 'features', dataType: 'boolean', label: 'ค้นหาตามตำแหน่ง', description: 'เปิดใช้งานการค้นหาด้วย GPS' },
    { key: 'enable_advanced_filters', value: 'true', category: 'features', dataType: 'boolean', label: 'ฟิลเตอร์ขั้นสูง', description: 'เปิดใช้งานตัวกรองขั้นสูง' },
    { key: 'search_radius_km', value: '10', category: 'features', dataType: 'string', label: 'รัศมีการค้นหา (km)', description: 'รัศมีการค้นหาร้านอาหารรอบๆ (กิโลเมตร)' },
    
    // Campaign System
    { key: 'enable_campaigns', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิดระบบแคมเปญ', description: 'อนุญาตให้ร้านค้าสร้างแคมเปญ' },
    { key: 'enable_campaign_approval', value: 'true', category: 'features', dataType: 'boolean', label: 'อนุมัติแคมเปญ', description: 'แคมเปญต้องได้รับการอนุมัติจาก admin' },
    { key: 'max_campaigns_per_shop', value: '5', category: 'features', dataType: 'string', label: 'แคมเปญสูงสุดต่อร้าน', description: 'จำนวนแคมเปญที่ร้านสามารถสร้างได้พร้อมกัน' },
    
    // Creator/Influencer Features
    { key: 'enable_creator_program', value: 'true', category: 'features', dataType: 'boolean', label: 'โปรแกรม Creator', description: 'เปิดใช้งานระบบ creator/influencer' },
    { key: 'min_followers_creator', value: '1000', category: 'features', dataType: 'string', label: 'Followers ขั้นต่ำ (Creator)', description: 'จำนวน followers ขั้นต่ำเพื่อสมัคร creator' },
    { key: 'creator_commission_rate', value: '10', category: 'features', dataType: 'string', label: 'ค่าคอมมิชชั่น Creator (%)', description: 'เปอร์เซ็นต์ค่าคอมมิชชั่นสำหรับ creator' },
    
    // Notifications
    { key: 'enable_push_notifications', value: 'true', category: 'features', dataType: 'boolean', label: 'Push Notifications', description: 'เปิดการแจ้งเตือนแบบ push' },
    { key: 'enable_email_notifications', value: 'true', category: 'features', dataType: 'boolean', label: 'Email Notifications', description: 'ส่งการแจ้งเตือนทาง email' },
    { key: 'enable_sms_notifications', value: 'false', category: 'features', dataType: 'boolean', label: 'SMS Notifications', description: 'ส่งการแจ้งเตือนทาง SMS' },
    
    // Payment & Subscriptions
    { key: 'enable_subscriptions', value: 'true', category: 'features', dataType: 'boolean', label: 'ระบบ Subscription', description: 'เปิดใช้งานระบบสมาชิกแบบเสียเงิน' },
    { key: 'enable_payments', value: 'true', category: 'features', dataType: 'boolean', label: 'ระบบชำระเงิน', description: 'เปิดใช้งานการชำระเงินออนไลน์' },
    { key: 'payment_gateway', value: 'omise', category: 'features', dataType: 'string', label: 'Payment Gateway', description: 'ระบบชำระเงิน (omise, stripe, promptpay)' },
    
    // Content Moderation
    { key: 'enable_content_moderation', value: 'true', category: 'features', dataType: 'boolean', label: 'ตรวจสอบเนื้อหา', description: 'เปิดระบบตรวจสอบเนื้อหาอัตโนมัติ' },
    { key: 'enable_spam_filter', value: 'true', category: 'features', dataType: 'boolean', label: 'กรอง Spam', description: 'เปิดการกรองข้อความ spam' },
    { key: 'enable_profanity_filter', value: 'true', category: 'features', dataType: 'boolean', label: 'กรองคำหยาบ', description: 'เปิดการกรองคำหยาบคาย' },
    
    // Analytics & Tracking
    { key: 'enable_analytics', value: 'true', category: 'features', dataType: 'boolean', label: 'Google Analytics', description: 'เปิดใช้งาน Google Analytics' },
    { key: 'google_analytics_id', value: '', category: 'features', dataType: 'string', label: 'GA Tracking ID', description: 'Google Analytics Tracking ID (GA4)' },
    { key: 'enable_facebook_pixel', value: 'false', category: 'features', dataType: 'boolean', label: 'Facebook Pixel', description: 'เปิดใช้งาน Facebook Pixel' },
    { key: 'facebook_pixel_id', value: '', category: 'features', dataType: 'string', label: 'Facebook Pixel ID', description: 'Facebook Pixel ID' },
    
    // API & Integrations
    { key: 'enable_api', value: 'true', category: 'features', dataType: 'boolean', label: 'Public API', description: 'เปิดใช้งาน public API' },
    { key: 'api_rate_limit', value: '100', category: 'features', dataType: 'string', label: 'API Rate Limit', description: 'จำนวน requests ต่อชั่วโมง' },
    
    // Performance
    { key: 'enable_image_optimization', value: 'true', category: 'features', dataType: 'boolean', label: 'ปรับรูปภาพอัตโนมัติ', description: 'บีบอัดและปรับขนาดรูปภาพ' },
    { key: 'enable_caching', value: 'true', category: 'features', dataType: 'boolean', label: 'เปิด Cache', description: 'เปิดใช้งานระบบ cache' },
    { key: 'cache_duration_minutes', value: '60', category: 'features', dataType: 'string', label: 'ระยะเวลา Cache (นาที)', description: 'ระยะเวลาเก็บ cache' },
  ];

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const setting of settings) {
    try {
      const existing = await prisma.siteSetting.findUnique({
        where: { key: setting.key }
      });

      if (existing) {
        // Update if exists
        await prisma.siteSetting.update({
          where: { key: setting.key },
          data: {
            label: setting.label,
            description: setting.description,
            category: setting.category,
            dataType: setting.dataType,
          }
        });
        updated++;
        console.log(`✅ Updated: ${setting.key}`);
      } else {
        // Create if not exists
        await prisma.siteSetting.create({
          data: setting
        });
        created++;
        console.log(`🆕 Created: ${setting.key}`);
      }
    } catch (error) {
      skipped++;
      console.error(`❌ Error with ${setting.key}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${settings.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
