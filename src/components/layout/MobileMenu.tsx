// src/components/layout/MobileMenu.tsx
"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function MobileMenu({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}) {
  const { data: session } = useSession();
  if (!open) return null;

  return (
    <div className="md:hidden border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={onClose} className="py-1">
            {l.label}
          </Link>
        ))}

        {!session ? (
          {/* ⭐ เปลี่ยนจาก signIn() เป็น Link */}
          <Link
            href="/signin"
            onClick={onClose}
            className="px-4 py-2 rounded bg-black text-white text-center"
          >
            เข้าสู่ระบบ
          </Link>
        ) : (
          <>
            <Link
              href="/dashboard/user"
              onClick={onClose}
              className="py-1"
            >
              โปรไฟล์
            </Link>
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="px-4 py-2 rounded border text-left"
            >
              ออกจากระบบ
            </button>
          </>
        )}
      </div>
    </div>
  );
}