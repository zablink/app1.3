-- Create shop_reviews table
CREATE TABLE IF NOT EXISTS "shop_reviews" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop_id" TEXT NOT NULL,
  "user_name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "shop_reviews_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "shop_reviews_shop_id_idx" ON "shop_reviews"("shop_id");
CREATE INDEX IF NOT EXISTS "shop_reviews_rating_idx" ON "shop_reviews"("rating");
