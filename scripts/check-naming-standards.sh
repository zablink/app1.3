#!/bin/bash
# Script to check for deprecated naming usage
# Run: ./scripts/check-naming-standards.sh

echo "🔍 Checking for deprecated naming patterns..."
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ISSUES=0

# Check for plan_id in SQL queries (should be package_id)
echo "📋 Checking for 'plan_id' in SQL queries..."
PLAN_ID_MATCHES=$(grep -rn "\.plan_id\|ss\.plan_id\|JOIN.*plan_id" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" || true)
if [ ! -z "$PLAN_ID_MATCHES" ]; then
  echo -e "${RED}❌ Found deprecated 'plan_id' usage:${NC}"
  echo "$PLAN_ID_MATCHES"
  echo ""
  ISSUES=$((ISSUES + 1))
else
  echo -e "${GREEN}✅ No 'plan_id' in SQL queries${NC}"
fi

# Check for planId in TypeScript (should be packageId for subscriptions)
echo ""
echo "📋 Checking for 'planId' in TypeScript code..."
PLANID_MATCHES=$(grep -rn "planId" src/app/api/ --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "// OK:" || true)
if [ ! -z "$PLANID_MATCHES" ]; then
  echo -e "${YELLOW}⚠️  Found 'planId' usage (verify if should be 'packageId'):${NC}"
  echo "$PLANID_MATCHES"
  echo ""
  ISSUES=$((ISSUES + 1))
else
  echo -e "${GREEN}✅ No 'planId' in API routes${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ All naming standards checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $ISSUES naming issues${NC}"
  echo ""
  echo "📖 See docs/NAMING_STANDARDS.md for correct usage"
  echo ""
  echo "Quick fixes:"
  echo "  - SQL: ss.plan_id → ss.package_id"
  echo "  - TypeScript: planId → packageId (for subscriptions)"
  exit 1
fi
