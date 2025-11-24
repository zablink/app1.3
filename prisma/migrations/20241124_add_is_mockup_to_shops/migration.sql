-- Add is_mockup column to shops table
ALTER TABLE "shops" ADD COLUMN "is_mockup" BOOLEAN NOT NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN "shops"."is_mockup" IS 'Flag to identify mockup/demo shops for testing purposes';
