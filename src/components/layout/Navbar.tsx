// components/layout/Navbar.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useLocation } from '@/contexts/LocationContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MapPin, Menu, X, User, LogOut, Store, BarChart3 } from 'lucide-react';
import LocationModal from '@/components/location/LocationModal';

export default function Navbar() {
  const { data: session } = useSession();
  const { location } = useLocation();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const userRole = (session?.user as any)?.role || 'USER';

  return (
    <>
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {settings.site_logo ? (
                <Image
                  src={settings.site_logo}
                  alt={settings.site_name || 'Zablink'}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Store className="w-8 h-8 text-blue-600" />
              )}
              <span className="text-xl font-bold text-gray-900">
                {settings.site_name || 'Zablink'}
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {/* Location Display */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {location ? (
                    <>
                      {location.tambonName && `${location.tambonName}, `}
                      {location.amphureName}
                    </>
                  ) : (
                    'เลือกพื้นที่'
                  )}
                </span>
              </button>

              {/* Navigation Links */}
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                หน้าแรก
              </Link>
              
              <Link href="/search" className="text-gray-700 hover:text-blue-600">
                ค้นหา
              </Link>

              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                    <BarChart3 className="w-5 h-5" />
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <User className="w-5 h-5" />
                      <span className="text-sm">{session.user?.name || 'User'}</span>
                    </button>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        โปรไฟล์
                      </Link>
                      
                      {userRole === 'SHOP' && (
                        <Link
                          href="/shop/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          จัดการร้าน
                        </Link>
                      )}

                      {userRole === 'ADMIN' && (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium"
                          >
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/admin/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            การตั้งค่าเว็บไซต์
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-700"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowLocationModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {location ? `${location.tambonName}, ${location.amphureName}` : 'เลือกพื้นที่'}
                  </span>
                </button>

                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  หน้าแรก
                </Link>

                <Link
                  href="/search"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ค้นหา
                </Link>

                {session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      โปรไฟล์
                    </Link>

                    {userRole === 'ADMIN' && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-purple-600 hover:bg-purple-50 font-medium"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          การตั้งค่าเว็บไซต์
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      ออกจากระบบ
                    </button>
                  </>
                ) : (
                  <Link
                    href="/signin"
                    className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    เข้าสู่ระบบ
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
}