#!/bin/bash

# Script สำหรับรัน migration user_bookmarks
# วันที่: 26 พฤศจิกายน 2025

echo "🚀 Starting User Bookmarks Migration..."
echo ""

# 1. Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# 2. Push schema to database
echo "📊 Step 2: Pushing schema to database..."
npx prisma db push
echo "✅ Database schema updated"
echo ""

# 3. Optional: Open Prisma Studio to verify
read -p "🔍 Do you want to open Prisma Studio to verify? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Opening Prisma Studio..."
    npx prisma studio
fi

echo ""
echo "✅ Migration completed successfully!"
echo "🎉 You can now use the bookmark feature!"
