'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  customItems?: BreadcrumbItem[];
}

export default function AdminBreadcrumb({ customItems }: BreadcrumbProps) {
  const pathname = usePathname();

  // Path name mappings in Thai
  const pathNameMap: Record<string, string> = {
    admin: 'แอดมิน',
    dashboard: 'Dashboard',
    settings: 'การตั้งค่า',
    shops: 'ร้านค้า',
    users: 'ผู้ใช้งาน',
    creators: 'Creators',
    categories: 'หมวดหมู่',
    'hero-banners': 'Hero Banners',
    'site-info': 'ข้อมูลเว็บไซต์',
    seo: 'SEO',
    appearance: 'รูปลักษณ์',
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return [{ label: 'Home', href: '/' }, ...customItems];
    }

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Skip dynamic routes like [id]
      if (path.startsWith('[') && path.endsWith(']')) {
        breadcrumbs.push({
          label: 'รายละเอียด',
          href: currentPath,
        });
      } else {
        breadcrumbs.push({
          label: pathNameMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
          href: currentPath,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="bg-white border-b px-4 py-3">
      <div className="container mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isHome = index === 0;

            return (
              <li key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                {isLast ? (
                  <span className="text-gray-900 font-medium flex items-center gap-1.5">
                    {isHome && <Home className="w-4 h-4" />}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1.5"
                  >
                    {isHome && <Home className="w-4 h-4" />}
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
