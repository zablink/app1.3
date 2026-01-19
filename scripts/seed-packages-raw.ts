import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

const packages = [
  {
    name: 'Free',
    price_monthly: 0,
    display_order: 1,
    display_weight: 10,
    badge_text: 'ฟรี',
    badge_emoji: '🆓',
    max_images: 1,
    max_menu_items: 5,
    max_delivery_links: 1,
    max_promotions: 0,
    analytics_retention_days: 0,
    has_advanced_analytics: false,
    can_pin_on_map: false,
    can_reply_reviews: false,
    can_set_special_hours: false,
    can_create_coupons: false,
    has_verified_badge: false,
    has_social_integration: false,
    monthly_commission_tokens: 0,
    banner_ad_discount_percent: 0,
    support_level: 'EMAIL',
    is_active: true,
    price: 0,
    period_days: 30,
    token_amount: 0,
    features: 'Basic listing',
    tier: SubscriptionTier.FREE,
  },
  {
    name: 'Basic',
    price_monthly: 299,
    display_order: 2,
    display_weight: 20,
    badge_text: 'แนะนำ',
    badge_emoji: '⭐',
    max_images: 5,
    max_menu_items: 20,
    max_delivery_links: 3,
    max_promotions: 2,
    analytics_retention_days: 30,
    has_advanced_analytics: false,
    can_pin_on_map: true,
    can_reply_reviews: true,
    can_set_special_hours: false,
    can_create_coupons: false,
    has_verified_badge: false,
    has_social_integration: false,
    monthly_commission_tokens: 10,
    banner_ad_discount_percent: 0,
    support_level: 'EMAIL',
    is_active: true,
    price: 299,
    period_days: 30,
    token_amount: 10,
    features: 'Priority listing, 10 tokens',
    tier: SubscriptionTier.BASIC,
  },
  {
    name: 'Pro',
    price_monthly: 599,
    display_order: 3,
    display_weight: 30,
    badge_text: 'โปร',
    badge_emoji: '🚀',
    max_images: 10,
    max_menu_items: 50,
    max_delivery_links: 5,
    max_promotions: 5,
    analytics_retention_days: 90,
    has_advanced_analytics: true,
    can_pin_on_map: true,
    can_reply_reviews: true,
    can_set_special_hours: true,
    can_create_coupons: true,
    has_verified_badge: true,
    has_social_integration: true,
    monthly_commission_tokens: 25,
    banner_ad_discount_percent: 10,
    support_level: 'EMAIL',
    is_active: true,
    price: 599,
    period_days: 30,
    token_amount: 25,
    features: 'Featured listing, 25 tokens, Analytics',
    tier: SubscriptionTier.PRO,
  },
  {
    name: 'Premium',
    price_monthly: 1299,
    display_order: 4,
    display_weight: 40,
    badge_text: 'พรีเมียม',
    badge_emoji: '👑',
    max_images: 20,
    max_menu_items: 100,
    max_delivery_links: 10,
    max_promotions: 10,
    analytics_retention_days: 180,
    has_advanced_analytics: true,
    can_pin_on_map: true,
    can_reply_reviews: true,
    can_set_special_hours: true,
    can_create_coupons: true,
    has_verified_badge: true,
    has_social_integration: true,
    monthly_commission_tokens: 60,
    banner_ad_discount_percent: 20,
    support_level: 'EMAIL',
    is_active: true,
    price: 1299,
    period_days: 30,
    token_amount: 60,
    features: 'Top placement, 60 tokens, Priority support',
    tier: SubscriptionTier.PREMIUM,
  },
];

async function main() {
  console.log('🌱 Seeding subscription packages...');
  for (const pkg of packages) {
    const found = await prisma.subscriptionPackage.findFirst({ where: { name: pkg.name } });
    if (!found) {
      await prisma.subscriptionPackage.create({ data: pkg });
      console.log(`✅ Created: ${pkg.name}`);
    } else {
      console.log(`ℹ️  Exists: ${pkg.name}`);
    }
  }
  const count = await prisma.subscriptionPackage.count();
  console.log(`\n✨ Done! Total packages: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
