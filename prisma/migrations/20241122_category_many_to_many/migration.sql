-- Migration: Convert Shop categories from one-to-many to many-to-many
-- This allows shops to have multiple categories

-- Step 1: Create new ShopCategoryMapping table
CREATE TABLE IF NOT EXISTS "shop_category_mapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_category_mapping_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shop_category_mapping_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ShopCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Add new fields to ShopCategory
ALTER TABLE "ShopCategory" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "ShopCategory" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "ShopCategory" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Step 3: Migrate existing category relationships to mapping table
-- Only migrate if categoryId column exists and has data
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Shop' AND column_name = 'categoryId'
    ) THEN
        INSERT INTO "shop_category_mapping" ("id", "shop_id", "category_id", "created_at")
        SELECT 
            gen_random_uuid()::text,
            id,
            "categoryId",
            CURRENT_TIMESTAMP
        FROM "Shop"
        WHERE "categoryId" IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Step 4: Generate slugs for existing categories (if slug is null)
-- Convert name to lowercase, replace spaces with hyphens
UPDATE "ShopCategory" 
SET "slug" = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9ก-๙]+', '-', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

-- Step 5: Add unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "shop_category_mapping_shop_id_category_id_key" 
ON "shop_category_mapping"("shop_id", "category_id");

CREATE INDEX IF NOT EXISTS "shop_category_mapping_shop_id_idx" 
ON "shop_category_mapping"("shop_id");

CREATE INDEX IF NOT EXISTS "shop_category_mapping_category_id_idx" 
ON "shop_category_mapping"("category_id");

CREATE UNIQUE INDEX IF NOT EXISTS "ShopCategory_slug_key" 
ON "ShopCategory"("slug");

-- Step 6: Make slug NOT NULL after data is populated
ALTER TABLE "ShopCategory" ALTER COLUMN "slug" SET NOT NULL;

-- Step 7: Drop old categoryId column from Shop table (only if exists)
-- Comment this out if you want to keep it temporarily for rollback
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Shop' AND column_name = 'categoryId'
    ) THEN
        ALTER TABLE "Shop" DROP COLUMN "categoryId";
    END IF;
END $$;
