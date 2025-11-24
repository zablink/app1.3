// scripts/reset-user-registration.ts
// Reset user registration - delete incomplete shop/creator data and reset role to USER

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteSupabaseImage(url: string | null) {
  if (!url) return;
  
  try {
    // Extract path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/shop-images/path/to/file.jpg
    const urlParts = url.split("/shop-images/");
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    const { error } = await supabase.storage
      .from("shop-images")
      .remove([filePath]);
    
    if (error) {
      console.log(`   ⚠️  Could not delete file from Supabase: ${filePath}`);
    } else {
      console.log(`   🗑️  Deleted from Supabase: ${filePath}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error deleting from Supabase: ${error}`);
  }
}

async function resetUserRegistration(email: string, type: "SHOP" | "CREATOR") {
  try {
    console.log(`🔄 Resetting ${type} registration for user: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);
    console.log(`📋 Current role: ${user.role}`);

    if (type === "SHOP") {
      // Find all shops owned by this user
      const shops = await prisma.shop.findMany({
        where: { ownerId: user.id },
      });

      console.log(`🏪 Shops: ${shops.length}`);

      // Delete all shops and related data
      for (const shop of shops) {
        console.log(`\n🗑️  Deleting shop: ${shop.name} (ID: ${shop.id})`);

        // Delete featured image from Supabase
        if (shop.image) {
          console.log(`   📸 Deleting featured image...`);
          await deleteSupabaseImage(shop.image);
        }

        // Get and delete gallery images from Supabase
        const galleryImages = await prisma.shop_gallery.findMany({
          where: { shop_id: shop.id },
        });
        
        if (galleryImages.length > 0) {
          console.log(`   📸 Deleting ${galleryImages.length} gallery images...`);
          for (const img of galleryImages) {
            await deleteSupabaseImage(img.image_url);
          }
        }

        // Delete shop links
        const deletedLinks = await prisma.shop_links.deleteMany({
          where: { shop_id: shop.id },
        });
        console.log(`   ✅ Deleted ${deletedLinks.count} shop links`);

        // Delete shop gallery
        const deletedGallery = await prisma.shop_gallery.deleteMany({
          where: { shop_id: shop.id },
        });
        console.log(`   ✅ Deleted ${deletedGallery.count} gallery images`);

        // Delete shop reviews
        const deletedReviews = await prisma.shopReview.deleteMany({
          where: { shopId: shop.id },
        });
        console.log(`   ✅ Deleted ${deletedReviews.count} reviews`);

        // Delete shop subscriptions
        const deletedSubscriptions = await prisma.shopSubscription.deleteMany({
          where: { shop_id: shop.id },
        });
        console.log(`   ✅ Deleted ${deletedSubscriptions.count} subscriptions`);

        // Delete shop category mappings
        const deletedCategories = await prisma.shopCategoryMapping.deleteMany({
          where: { shopId: shop.id },
        });
        console.log(`   ✅ Deleted ${deletedCategories.count} category mappings`);

        // Finally delete the shop
        await prisma.shop.delete({
          where: { id: shop.id },
        });
        console.log(`   ✅ Deleted shop`);
      }

      // Reset user role to USER
      await prisma.user.update({
        where: { email },
        data: { role: "USER" },
      });
      console.log(`\n✅ User role reset to USER`);
    } else if (type === "CREATOR") {
      // Find all creators owned by this user
      const creators = await prisma.creators.findMany({
        where: { userId: user.id },
      });

      console.log(`🎥 Creators: ${creators.length}`);

      // Delete all creators and related data
      for (const creator of creators) {
        console.log(`\n🗑️  Deleting creator: ${creator.displayName} (ID: ${creator.id})`);

        // Finally delete the creator
        await prisma.creators.delete({
          where: { id: creator.id },
        });
        console.log(`   ✅ Deleted creator`);
      }

      // Reset user role to USER
      await prisma.user.update({
        where: { email },
        data: { role: "USER" },
      });
      console.log(`\n✅ User role reset to USER`);
    }

    console.log(`\n🎉 Successfully reset ${type} registration for ${email}`);
    console.log(`✅ You can now register again!`);
  } catch (error) {
    console.error("❌ Error resetting user registration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const type = process.argv[3] as "SHOP" | "CREATOR";

if (!email || !type) {
  console.log("Usage: tsx scripts/reset-user-registration.ts <email> <SHOP|CREATOR>");
  console.log("Example: tsx scripts/reset-user-registration.ts user@example.com SHOP");
  process.exit(1);
}

if (type !== "SHOP" && type !== "CREATOR") {
  console.log("❌ Type must be either SHOP or CREATOR");
  process.exit(1);
}

resetUserRegistration(email, type);
