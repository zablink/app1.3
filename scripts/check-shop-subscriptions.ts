import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShopSubscriptions() {
  try {
    // Get all columns
    const columns = await prisma.$queryRawUnsafe<any[]>(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'shop_subscriptions' 
      ORDER BY ordinal_position;
    `);

    console.log('\n=== shop_subscriptions columns ===');
    columns.forEach((col, i) => {
      console.log(`${i + 1}. ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}, default: ${col.column_default || 'none'}`);
    });

    console.log('\n=== Total columns:', columns.length);

    // Try a simple insert to see what's required
    const testId = 'test-' + Math.random().toString(36).substring(2, 15);
    const testShopId = '069dda4d-3e75-4497-abad-1e93d4c5f932'; // from error message
    const testPackageId = '4bc07fd3-894e-4848-bd74-62610bd8bab3'; // from error message
    
    console.log('\n=== Attempting test insert ===');
    console.log('Test values:');
    console.log('- id:', testId);
    console.log('- shop_id:', testShopId);
    console.log('- package_id:', testPackageId);
    console.log('- status: ACTIVE');
    console.log('- start_date: NOW()');
    console.log('- end_date: NOW() + INTERVAL \'30 days\'');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopSubscriptions();
