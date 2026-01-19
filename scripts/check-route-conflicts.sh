#!/bin/bash
# Check for route conflicts in Next.js App Router
# A folder cannot have both page.tsx and route.ts

echo "🔍 Checking for route conflicts..."
echo ""

CONFLICTS=0
APP_DIR="src/app"

# Find directories with both page.tsx and route.ts
while IFS= read -r dir; do
  if [ -f "$dir/page.tsx" ] && [ -f "$dir/route.ts" ]; then
    echo "❌ CONFLICT FOUND: $dir"
    echo "   Has both page.tsx and route.ts"
    echo ""
    CONFLICTS=$((CONFLICTS + 1))
  fi
done < <(find "$APP_DIR" -type d)

# Also check for page.ts and route.ts
while IFS= read -r dir; do
  if [ -f "$dir/page.ts" ] && [ -f "$dir/route.ts" ]; then
    echo "❌ CONFLICT FOUND: $dir"
    echo "   Has both page.ts and route.ts"
    echo ""
    CONFLICTS=$((CONFLICTS + 1))
  fi
done < <(find "$APP_DIR" -type d)

# Check for route.ts in non-api folders (common mistake)
echo "⚠️  Checking for route.ts files outside /api..."
echo ""

while IFS= read -r file; do
  # Check if the file is NOT in /api directory
  if [[ ! "$file" =~ /api/ ]]; then
    echo "⚠️  WARNING: $file"
    echo "   route.ts should typically be in /api directories"
    echo "   If this is a page, rename to page.tsx"
    echo ""
  fi
done < <(find "$APP_DIR" -name "route.ts" -type f)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $CONFLICTS -eq 0 ]; then
  echo "✅ No route conflicts found!"
else
  echo "❌ Found $CONFLICTS conflict(s)"
  echo ""
  echo "📖 Next.js Rule:"
  echo "   - page.tsx = UI page (renders HTML)"
  echo "   - route.ts = API endpoint (returns JSON)"
  echo "   - Cannot have both in same folder"
  echo ""
  echo "💡 Solution:"
  echo "   - Move route.ts to /api/[path]/"
  echo "   - Or rename to different path"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
