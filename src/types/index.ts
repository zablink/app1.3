export interface SubscriptionPackage {
    id: string;
    name: string;
    price: number;
    features: string | null; // Changed from description to features and allowing null
    // Add other fields from your prisma schema if they are needed on the frontend
  }