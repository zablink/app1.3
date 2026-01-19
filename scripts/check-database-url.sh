#!/bin/bash
# Script to check and convert DATABASE_URL for Vercel

echo "🔍 Checking DATABASE_URL configuration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Extract DATABASE_URL from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env"
    exit 1
fi

echo "📋 Current DATABASE_URL (safe):"
echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/g'
echo ""

# Check if using direct connection (port 5432)
if echo "$DATABASE_URL" | grep -q ":5432"; then
    echo "⚠️  Using DIRECT connection (port 5432)"
    echo "   This will NOT work in Vercel production!"
    echo ""
    
    # Convert to pooler connection
    POOLER_URL=$(echo "$DATABASE_URL" | sed 's/:5432\//:6543\/?pgbouncer=true/')
    
    echo "✅ Recommended DATABASE_URL for Vercel (Connection Pooler):"
    echo "$POOLER_URL" | sed 's/:[^:@]*@/:****@/g'
    echo ""
    echo "📝 Steps to fix:"
    echo "1. Go to Vercel Dashboard → Project → Settings → Environment Variables"
    echo "2. Add/Edit DATABASE_URL with the pooler URL above"
    echo "3. Redeploy your project"
    echo ""
elif echo "$DATABASE_URL" | grep -q ":6543"; then
    echo "✅ Using CONNECTION POOLER (port 6543)"
    echo "   This should work in Vercel production!"
    echo ""
    echo "💡 Make sure this URL is set in Vercel Environment Variables"
elif echo "$DATABASE_URL" | grep -q "pooler"; then
    echo "✅ Using CONNECTION POOLER (pooler subdomain)"
    echo "   This should work in Vercel production!"
    echo ""
    echo "💡 Make sure this URL is set in Vercel Environment Variables"
else
    echo "⚠️  Unknown connection type"
    echo "   Please verify your DATABASE_URL format"
fi

echo ""
echo "🔗 Test endpoints:"
echo "   - https://dev.zablink.com/api/test-env"
echo "   - https://dev.zablink.com/api/shops/test-connection"
