"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/cron/check_expirations.ts
const prisma_1 = __importDefault(require("../src/lib/prisma"));
async function main() {
    console.log("Cron: check expirations start", new Date().toISOString());
    const now = new Date();
    // 1) Expire shop subscriptions that passed expiresAt
    const expiredSubs = await prisma_1.default.shopSubscription.updateMany({
        where: { expiresAt: { lt: now }, status: "ACTIVE" },
        data: { status: "EXPIRED" },
    });
    console.log("Expired subscriptions updated:", expiredSubs.count);
    // 2) Optionally expire token purchases (mark remaining = 0 when expires)
    const expiredPurchases = await prisma_1.default.tokenPurchase.findMany({
        where: { expiresAt: { lt: now }, remaining: { gt: 0 } },
    });
    for (const p of expiredPurchases) {
        // Business policy: when a purchase expires, we remove its remaining tokens from wallet.balance
        // and set remaining to 0. Adjust policy as you prefer.
        const wallet = await prisma_1.default.tokenWallet.findUnique({ where: { id: p.walletId } });
        if (wallet) {
            const newBalance = Math.max(0, wallet.balance - p.remaining);
            await prisma_1.default.tokenWallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
            });
        }
        await prisma_1.default.tokenPurchase.update({
            where: { id: p.id },
            data: { remaining: 0 },
        });
        console.log(`Expired tokenPurchase ${p.id} and deducted ${p.remaining} tokens from wallet`);
    }
    console.log("Cron: done", new Date().toISOString());
}
main()
    .catch((e) => {
    +console.error("Cron error:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
