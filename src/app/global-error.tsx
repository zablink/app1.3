'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">
            เกิดข้อผิดพลาดในการโหลดหน้าเว็บ กรุณาลองรีเฟรชหน้าหรือกลับไปหน้าแรก
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ลองอีกครั้ง
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              หน้าแรก
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
