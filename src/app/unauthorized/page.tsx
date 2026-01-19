// src/app/unauthorized/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ShieldX, Home, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'USER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>

          {/* User Info */}
          {session && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">คุณเข้าสู่ระบบในฐานะ:</p>
              <p className="font-semibold text-gray-900">{session.user?.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                บทบาท: <span className="font-medium">{userRole}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              กลับหน้าหลัก
            </Link>

            {session && (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                ออกจากระบบ
              </button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}
