-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_idx" ON "user_bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "user_bookmarks_shop_id_idx" ON "user_bookmarks"("shop_id");

-- CreateIndex
CREATE INDEX "user_bookmarks_created_at_idx" ON "user_bookmarks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_user_id_shop_id_key" ON "user_bookmarks"("user_id", "shop_id");

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
