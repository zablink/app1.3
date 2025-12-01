// src/app/about/page.tsx
import Link from 'next/link';
import { Store, Users, Award, Heart } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            เกี่ยวกับเรา
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            แพลตฟอร์มเชื่อมโยงร้านค้าและผู้บริโภคในท้องถิ่นของคุณ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            พันธกิจของเรา
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            เราเชื่อว่าร้านค้าในท้องถิ่นทุกแห่งควรได้รับโอกาสในการเข้าถึงลูกค้าออนไลน์อย่างเท่าเทียม 
            Zablink ถูกสร้างขึ้นเพื่อเป็นสะพานเชื่อมระหว่างร้านค้าและผู้บริโภค 
            ช่วยให้ผู้คนค้นหาร้านค้าที่ใช่ในพื้นที่ของตนได้ง่ายขึ้น
          </p>
          <p className="text-gray-700 leading-relaxed">
            เราไม่เพียงแค่เป็นไดเรกทอรีร้านค้า แต่เรายังเป็นชุมชนที่ร้านค้าและลูกค้าสามารถมีปฏิสัมพันธ์ 
            แบ่งปันประสบการณ์ และสร้างความสัมพันธ์ที่ยั่งยืน
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              ร้านค้าคุณภาพ
            </h3>
            <p className="text-sm text-gray-600">
              คัดสรรร้านค้าที่มีคุณภาพและน่าเชื่อถือ
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              ชุมชนท้องถิ่น
            </h3>
            <p className="text-sm text-gray-600">
              เชื่อมโยงคนในชุมชนเดียวกัน
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              รีวิวจริง
            </h3>
            <p className="text-sm text-gray-600">
              รีวิวจากผู้ใช้จริงที่ผ่านการตรวจสอบ
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              ง่ายต่อการใช้งาน
            </h3>
            <p className="text-sm text-gray-600">
              ค้นหาและติดต่อร้านค้าได้อย่างรวดเร็ว
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ตัวเลขที่น่าภูมิใจ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">1,000+</div>
              <div className="text-sm text-gray-600">ร้านค้า</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">10,000+</div>
              <div className="text-sm text-gray-600">ผู้ใช้งาน</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-1">5,000+</div>
              <div className="text-sm text-gray-600">รีวิว</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600 mb-1">50+</div>
              <div className="text-sm text-gray-600">จังหวัด</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            พร้อมเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            ไม่ว่าคุณจะเป็นเจ้าของร้านค้าที่ต้องการขยายฐานลูกค้า 
            หรือผู้บริโภคที่กำลังมองหาร้านค้าคุณภาพในพื้นที่ เราพร้อมช่วยคุณ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ลงทะเบียนร้านค้า
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              เรียกดูร้านค้า
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span>←</span>
            <span>กลับหน้าแรก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
