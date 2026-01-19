import { prisma } from '../src/lib/prisma';

const shopNames = [
  'ครัวคุณแม่', 'บ้านข้าวแกง', 'ก๋วยเตี๋ยวเรือเด็ด', 'ข้าวมันไก่เจ้าเก่า', 'ร้านอาหารตามสั่ง',
  'ส้มตำแซ่บเว่อร์', 'ข้าวต้มปลา', 'ข้าวเหนียวหมูปิ้ง', 'ข้าวขาหมู', 'ข้าวหมูแดง',
  'ข้าวราดแกง', 'ข้าวผัดปู', 'ข้าวผัดกุ้ง', 'ข้าวผัดหมูกรอบ', 'ข้าวผัดทะเล',
  'ข้าวผัดแหนม', 'ข้าวผัดน้ำพริก', 'ข้าวผัดปลาสลิด', 'ข้าวผัดต้มยำ', 'ข้าวผัดไข่เค็ม'
];

const addresses = [
  '123 ถนนสุขุมวิท', '456 ถนนพระราม 9', '789 ถนนรามคำแหง', '101 ถนนลาดพร้าว', '202 ถนนจตุจักร',
  '303 ถนนบางนา', '404 ถนนพหลโยธิน', '505 ถนนรังสิต', '606 ถนนวิภาวดี', '707 ถนนจันทน์',
  '808 ถนนสีลม', '909 ถนนสาทร', '111 ถนนราชพฤกษ์', '222 ถนนรัชดา', '333 ถนนเพชรบุรี',
  '444 ถนนจอมทอง', '555 ถนนบางขุนเทียน', '666 ถนนบางพลัด', '777 ถนนบางแค', '888 ถนนบางบอน'
];

const images = [
  '/images/banner/food1.jpg', '/images/banner/food2.jpg', '/images/banner/food3.jpg', '/images/banner/food4.jpg', '/images/banner/food5.jpg',
  '/images/banner/food6.jpg', '/images/banner/food7.jpg', '/images/banner/food8.jpg', '/images/banner/food9.jpg', '/images/banner/food10.jpg',
  '/images/banner/food11.jpg', '/images/banner/food12.jpg', '/images/banner/food13.jpg', '/images/banner/food14.jpg', '/images/banner/food15.jpg',
  '/images/banner/food16.jpg', '/images/banner/food17.jpg', '/images/banner/food18.jpg', '/images/banner/food19.jpg', '/images/banner/food20.jpg'
];

async function getOwnerId() {
  // Get first user as owner, or create one if none exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'dummyowner@example.com',
        name: 'เจ้าของร้านตัวอย่าง',
        password: 'dummy123',
      }
    });
  }
  return user.id;
}

async function main() {
  const ownerId = await getOwnerId();
  console.log('👤 Using ownerId:', ownerId);

  for (let i = 0; i < 20; i++) {
    const name = shopNames[i];
    const address = addresses[i];
    const image = images[i];
    const description = `ร้านอาหารตัวอย่าง ${name} อร่อย สะอาด บรรยากาศดี`;
    await prisma.shop.create({
      data: {
        ownerId,
        name,
        address,
        image,
        description,
        has_physical_store: true,
        show_location_on_map: true,
        isMockup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lat: 13.7 + Math.random() * 0.2,
        lng: 100.5 + Math.random() * 0.2,
        status: 'ACTIVE',
      }
    });
    console.log(`✅ Created shop: ${name}`);
  }
  const count = await prisma.shop.count();
  console.log(`\n✨ Done! Total shops: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding shops:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });