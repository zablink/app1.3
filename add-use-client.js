const fs = require('fs');
const path = require('path');

const files = [
  'src/contexts/LocationContext.tsx',
  'src/contexts/ToastContext.tsx',
  'src/app/creator/register/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/upgrade/reviewer/page.tsx',
  'src/app/HomePageClient.tsx',
  'src/app/category/page.tsx',
  'src/app/category/[slug]/page.tsx',
  'src/app/payment/subscription/page.tsx',
  'src/app/payment/page.tsx',
  'src/app/shop/[shopId]/ShopDetailPageClient.tsx',
  'src/app/shop/edit/[shopId]/page.tsx',
  'src/app/shop/register/page.tsx',
  'src/app/shop/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/settings/analytics/page.tsx',
  'src/app/admin/shops/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/creators/[id]/page.tsx',
  'src/app/admin/creators/page.tsx',
  'src/app/admin/campaigns/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/categories/page.tsx',
  'src/app/unauthorized/page.tsx',
  'src/app/dashboard/creator/settings/page.tsx',
  'src/app/dashboard/creator/earnings/page.tsx',
  'src/app/dashboard/creator/campaigns/[id]/page.tsx',
  'src/app/dashboard/creator/jobs/[id]/page.tsx',
  'src/app/dashboard/creator/jobs/page.tsx',
  'src/app/dashboard/creator/withdraw/page.tsx',
  'src/app/dashboard/creator/page.tsx',
  'src/app/dashboard/shop/ads/AdsClientPage.tsx',
  'src/app/dashboard/shop/ads/page.tsx',
  'src/app/dashboard/shop/settings/page.tsx',
  'src/app/dashboard/shop/campaigns/[id]/page.tsx',
  'src/app/dashboard/shop/campaigns/page.tsx',
  'src/app/dashboard/shop/select-reviewers/page.tsx',
  'src/app/dashboard/shop/page.tsx',
  'src/app/dashboard/shop/reports/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/location-finder/page.tsx',
  'src/app/bookmarks/shared/page.tsx',
  'src/app/bookmarks/page.tsx',
  'src/app/signin/SignInForm.tsx',
  'src/app/profile/page.tsx',
  'src/app/categories/page.tsx',
  'src/app/pricing/renewal/page.tsx',
  'src/app/pricing/cart/token/page.tsx',
  'src/app/pricing/cart/package/page.tsx',
  'src/components/UserMenu.tsx',
  'src/components/location/LocationModal.tsx',
  'src/components/location/GPSButton.tsx',
  'src/components/layout/Navbar.tsx',
  'src/components/shop/ShopGalleryManager.tsx',
  'src/components/shop/ShopLinksManager.tsx',
  'src/components/shop/MapPicker.tsx',
  'src/components/admin/ImageUploadZone.tsx',
  'src/components/admin/Breadcrumb.tsx',
  'src/components/admin/ShopCategoryManager.tsx',
  'src/components/BookmarkButton.tsx',
  'src/components/SearchResults.tsx',
  'src/components/Notification.tsx',
  'src/components/GoogleAnalytics.tsx',
  'src/components/AdPlacement.tsx',
  'src/components/BookmarkMapView.tsx',
  'src/hooks/useAdBanner.ts',
  'src/hooks/useSiteSettings.tsx',
  'src/hooks/useBookmark.ts',
  'src/hooks/useAnalytics.ts',
  'src/hooks/useLocationPicker.ts'
];

let success = 0;
let skipped = 0;
let notFound = 0;

files.forEach(file => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`❌ Not found: ${file}`);
      notFound++;
      return;
    }

    const content = fs.readFileSync(file, 'utf8');
    
    // เช็คว่ามี 'use client' อยู่แล้วหรือยัง
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log(`⏭️  Skipped: ${file} (already has 'use client')`);
      skipped++;
      return;
    }

    // เพิ่ม 'use client' ที่บรรทัดแรก
    const newContent = `'use client'\n\n${content}`;
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✅ Added: ${file}`);
    success++;
  } catch (error) {
    console.log(`❌ Error with ${file}: ${error.message}`);
  }
});

console.log('\n=== Summary ===');
console.log(`✅ Successfully added: ${success} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log(`❌ Not found: ${notFound} files`);
console.log('\nDone! Please restart your dev server.');