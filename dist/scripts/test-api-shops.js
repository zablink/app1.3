// scripts/test-api-shops.ts
async function testApiShops() {
    var _a;
    try {
        const response = await fetch('http://localhost:3000/api/shops?limit=50');
        const data = await response.json();
        console.log('Total shops returned:', ((_a = data.shops) === null || _a === void 0 ? void 0 : _a.length) || 0);
        // Group by tier
        const grouped = (data.shops || []).reduce((acc, shop) => {
            const tier = shop.subscriptionTier || 'UNKNOWN';
            if (!acc[tier])
                acc[tier] = [];
            acc[tier].push(shop);
            return acc;
        }, {});
        console.log('\n=== Shops grouped by tier ===');
        Object.keys(grouped).sort().forEach(tier => {
            console.log(`\n${tier}: ${grouped[tier].length} shops`);
            grouped[tier].slice(0, 5).forEach((shop) => {
                console.log(`  - ${shop.name} (${shop.id})`);
            });
            if (grouped[tier].length > 5) {
                console.log(`  ... and ${grouped[tier].length - 5} more`);
            }
        });
        console.log('\n=== Summary ===');
        console.log(JSON.stringify(Object.keys(grouped).map(tier => ({ tier, count: grouped[tier].length })), null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testApiShops();
