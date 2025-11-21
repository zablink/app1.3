// scripts/seed-shop-reviews.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reviewTemplates = [
  { userName: 'สมชาย ใจดี', rating: 5, comment: 'อร่อยมาก บริการดี จะมาใหม่แน่นอน' },
  { userName: 'กิตติ รักอาหาร', rating: 4, comment: 'รสชาติดี แต่รอนานหน่อย' },
  { userName: 'นิดา หิวข้าว', rating: 5, comment: 'เป็นร้านประจำแล้ว อาหารสด สะอาด' },
  { userName: 'ประวิทย์ กินดี', rating: 5, comment: 'ราคาไม่แพง คุณภาพดีมาก แนะนำเลย' },
  { userName: 'วรรณา ชอบกิน', rating: 4, comment: 'อร่อยดี บรรยากาศดี น่านั่ง' },
  { userName: 'สุดา เที่ยวกิน', rating: 5, comment: 'มาลองแล้วชอบมาก จะกลับมาอีก' },
  { userName: 'เจน พงษ์', rating: 3, comment: 'โอเค พอใช้ได้ ปกติ' },
  { userName: 'มานี มีสุข', rating: 5, comment: 'ต้องลอง! อร่อยจริงๆ' },
  { userName: 'บุญมี ดีงาม', rating: 4, comment: 'คุ้มค่า ราคาดี อาหารอร่อย' },
  { userName: 'ชัยวัฒน์ กล้า', rating: 5, comment: 'ประทับใจมาก เจ้าของร้านใจดี' },
  { userName: 'พิมพ์ใจ สวย', rating: 5, comment: 'แนะนำให้เพื่อนมาทุกคน ถูกและดี' },
  { userName: 'อรุณ รุ่งเรือง', rating: 4, comment: 'ดีครับ จะกลับมาอีก' },
  { userName: 'จิราพร แสงทอง', rating: 5, comment: 'สุดยอด! ของโปรดใหม่แล้ว' },
  { userName: 'ธนพล รวย', rating: 4, comment: 'รสชาติดี ปริมาณเยอะ คุ้ม' },
  { userName: 'ปิยะ มั่นคง', rating: 5, comment: 'ชอบมากค่ะ จะมาอุดหนุนบ่อยๆ' },
];

async function main() {
  console.log('🌟 Seeding shop reviews...');

  // Get all shops
  const shops = await prisma.shop.findMany({
    select: { id: true, name: true }
  });

  console.log(`Found ${shops.length} shops`);

  let totalReviews = 0;

  for (const shop of shops) {
    // Random number of reviews per shop (2-8 reviews)
    const numReviews = Math.floor(Math.random() * 7) + 2;
    
    // Shuffle templates and pick random ones
    const shuffled = [...reviewTemplates].sort(() => Math.random() - 0.5);
    const selectedReviews = shuffled.slice(0, numReviews);

    for (const template of selectedReviews) {
      await prisma.shopReview.create({
        data: {
          shopId: shop.id,
          userName: template.userName,
          rating: template.rating,
          comment: template.comment,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        }
      });
      totalReviews++;
    }

    console.log(`✅ ${shop.name}: Added ${numReviews} reviews`);
  }

  console.log(`\n✨ Done! Added ${totalReviews} reviews to ${shops.length} shops.`);
  
  // Show stats
  const avgReviews = totalReviews / shops.length;
  const reviewStats = await prisma.shopReview.groupBy({
    by: ['rating'],
    _count: true
  });
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Average reviews per shop: ${avgReviews.toFixed(1)}`);
  console.log(`   Rating distribution:`);
  reviewStats.forEach(stat => {
    console.log(`   ${stat.rating} ⭐: ${stat._count} reviews`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
