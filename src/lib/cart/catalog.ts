export type TokenPackId = "pack_100" | "pack_500" | "pack_1000" | "pack_5000";

export const TOKEN_PACKS: Record<
  TokenPackId,
  { id: TokenPackId; baseTokens: number; bonusTokens: number; priceTHB: number }
> = {
  pack_100: { id: "pack_100", baseTokens: 100, bonusTokens: 0, priceTHB: 100 },
  pack_500: { id: "pack_500", baseTokens: 500, bonusTokens: 25, priceTHB: 475 },
  pack_1000: { id: "pack_1000", baseTokens: 1000, bonusTokens: 100, priceTHB: 900 },
  pack_5000: { id: "pack_5000", baseTokens: 5000, bonusTokens: 750, priceTHB: 4250 },
};

export function findTokenPackByNumbers(input: {
  totalTokens: number;
  bonusTokens: number;
  priceTHB: number;
}): TokenPackId | null {
  const entries = Object.values(TOKEN_PACKS);
  const match = entries.find((p) => {
    const total = p.baseTokens + p.bonusTokens;
    return total === input.totalTokens && p.bonusTokens === input.bonusTokens && p.priceTHB === input.priceTHB;
  });
  return match?.id ?? null;
}

