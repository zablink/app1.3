// src/components/layout/Footer.tsx
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-300">
            © {currentYear} Vertex Horizons Co.,Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
