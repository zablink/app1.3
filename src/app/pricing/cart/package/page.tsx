'use client';

import { useState, useEffect } from 'react';
import { SubscriptionPackage } from '@/types';

export default function PackagePage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/packages');
        const data = await res.json();
        setPackages(data);
      } catch (err) {
        setError('Failed to load packages.');
      }
    };

    fetchPackages();
  }, []);

  const handleCheckout = async (packageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError('Checkout failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Select a Package</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{pkg.name}</h2>
            <p className="text-gray-500">THB {pkg.price}</p>
            <p>{pkg.description}</p>
            <button
              onClick={() => handleCheckout(pkg.id)}
              disabled={loading}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
