"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const banners = await prisma.heroBanner.findMany({
        select: {
            id: true,
            title: true,
            enableOverlay: true,
            link: true,
            isActive: true
        }
    });
    console.log('Current banners:');
    console.log(JSON.stringify(banners, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
