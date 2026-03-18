// src/app/pricing/page.tsx
import Link from 'next/link';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { PricingAddToCartButton } from "./PricingAddToCartButton";

export default function PricingPage() {
  const subscriptionPackages = [
    {
      name: 'FREE',
      price: 0,
      period: 'ตลอดไป',
      icon: Star,
      color: 'from-gray-400 to-gray-600',
      features: [
        'ลงข้อมูลร้านค้าพื้นฐาน',
        'อัพโหลดรูปภาพได้ 3 รูป',
        'แสดงในผลการค้นหา',
        'รับรีวิวจากลูกค้า',
      ],
      limitations: [
        'ไม่มีตำแหน่งพิเศษ',
        'ไม่สามารถโปรโมทได้',
      ]
    },
    {
      name: 'BASIC',
      price: 199,
      period: 'ต่อเดือน',
      icon: Zap,
      color: 'from-blue-400 to-cyan-400',
      popular: false,
      features: [
        'ทุกอย่างใน FREE',
        'อัพโหลดรูปภาพได้ 10 รูป',
        'ป้าย "Verified" บนร้าน',
        'ลิงก์แพลตฟอร์มส่งอาหาร',
        'สถิติการเข้าชมร้าน',
        'รับ 100 Tokens ฟรี',
      ]
    },
    {
      name: 'PRO',
      price: 499,
      period: 'ต่อเดือน',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        'ทุกอย่างใน BASIC',
        'อัพโหลดรูปภาพได้ 30 รูป',
        'ป้าย "Pro Shop" โดดเด่น',
        'แสดงในหน้าแรก (แบบสุ่ม)',
        'สถิติแบบละเอียด',
        'รับ 300 Tokens ฟรี',
        'ส่วนลด 10% โฆษณา',
      ]
    },
    {
      name: 'PREMIUM',
      price: 999,
      period: 'ต่อเดือน',
      icon: Crown,
      color: 'from-yellow-400 to-amber-500',
      popular: false,
      features: [
        'ทุกอย่างใน PRO',
        'อัพโหลดรูปภาพไม่จำกัด',
        'ป้าย "Premium Partner" พิเศษ',
        'ติดหน้าแรกเป็นพิเศษ',
        'การวิเคราะห์ขั้นสูง',
        'รับ 700 Tokens ฟรี',
        'ส่วนลด 20% โฆษณา',
        'ตัวแทนเฉพาะ (Account Manager)',
      ]
    }
  ];

  const adPricing = [
    {
      name: 'โฆษณาระดับตำบล',
      description: 'แสดงร้านของคุณให้คนในตำบลเห็นเป็นอันดับแรก',
      basePrice: '50 Tokens/วัน',
      features: [
        'แสดงตำแหน่งบนสุดในพื้นที่',
        'ครอบคลุม 1 ตำบล',
        'เหมาะสำหรับร้านขนาดเล็ก',
      ]
    },
    {
      name: 'โฆษณาระดับอำเภอ',
      description: 'ขยายการมองเห็นไปทั้งอำเภอ',
      basePrice: '200 Tokens/วัน',
      features: [
        'แสดงทั้งอำเภอ',
        'เข้าถึงลูกค้ามากขึ้น',
        'เหมาะสำหรับร้านขนาดกลาง',
      ]
    },
    {
      name: 'โฆษณาระดับจังหวัด',
      description: 'ครอบคลุมทั้งจังหวัด',
      basePrice: '500 Tokens/วัน',
      features: [
        'แสดงทั้งจังหวัด',
        'เหมาะสำหรับแบรนด์ที่มีหลายสาขา',
        'เพิ่มการรับรู้แบรนด์',
      ]
    },
    {
      name: 'โฆษณาระดับภูมิภาค',
      description: 'เข้าถึงทั้งภูมิภาค',
      basePrice: '1,500 Tokens/วัน',
      features: [
        'ครอบคลุมหลายจังหวัด',
        'เหมาะสำหรับแบรนด์ระดับภูมิภาค',
        'การมองเห็นสูงสุด',
      ]
    },
    {
      name: 'โฆษณาระดับประเทศ',
      description: 'แสดงทั่วประเทศไทย',
      basePrice: '3,000 Tokens/วัน',
      features: [
        'แสดงทุกพื้นที่ทั่วประเทศ',
        'เหมาะสำหรับแบรนด์ระดับประเทศ',
        'ROI สูงสุด',
      ]
    }
  ];

  const tokenPricing = [
    {
      amount: 100,
      price: 100,
      bonus: 0,
      popular: false
    },
    {
      amount: 500,
      price: 475,
      bonus: 25,
      popular: false
    },
    {
      amount: 1000,
      price: 900,
      bonus: 100,
      popular: true
    },
    {
      amount: 5000,
      price: 4250,
      bonus: 750,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            แพ็คเกจและราคา
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            เลือกแพ็คเกจที่เหมาะกับธุรกิจของคุณ และเริ่มต้นเติบโตไปกับเรา
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Subscription Packages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-2">
            แพ็คเกจสมาชิก
          </h2>
          <p className="text-gray-600 text-center mb-8">
            เลือกแพ็คเกจที่เหมาะกับขนาดธุรกิจของคุณ
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPackages.map((pkg) => {
              const IconComponent = pkg.icon;
              return (
                <div
                  key={pkg.name}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    pkg.popular ? 'ring-2 ring-purple-500 relative' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="bg-purple-500 text-white text-center py-1 text-sm font-semibold">
                      ⭐ แนะนำ
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${pkg.color} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-center mb-2">
                      {pkg.name}
                    </h3>
                    
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">฿{pkg.price}</span>
                      <span className="text-gray-600">/{pkg.period}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {pkg.limitations?.map((limitation, index) => (
                        <li key={`limit-${index}`} className="flex items-start gap-2">
                          <span className="text-gray-400 text-sm">✗</span>
                          <span className="text-sm text-gray-400 line-through">{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    <PricingAddToCartButton
                      kind="subscription"
                      tier={pkg.name}
                      className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                        pkg.popular
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      เริ่มต้นใช้งาน
                    </PricingAddToCartButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Token Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-2">
            ราคา Token
          </h2>
          <p className="text-gray-600 text-center mb-8">
            ซื้อ Token เพื่อใช้ในการโฆษณาและบริการพิเศษต่างๆ
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {tokenPricing.map((token) => (
              <div
                key={token.amount}
                className={`bg-white rounded-lg shadow-lg p-6 ${
                  token.popular ? 'ring-2 ring-blue-500 relative' : ''
                }`}
              >
                {token.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    คุ้มที่สุด
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-4xl mb-2">🪙</div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {token.amount + token.bonus}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Tokens
                    {token.bonus > 0 && (
                      <span className="block text-green-600 font-semibold">
                        +{token.bonus} โบนัส!
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-4">
                    ฿{token.price}
                  </div>
                  <PricingAddToCartButton
                    kind="token_pack"
                    packId={
                      token.amount === 100 ? "pack_100" : token.amount === 500 ? "pack_500" : token.amount === 1000 ? "pack_1000" : "pack_5000"
                    }
                    className="block w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    ซื้อเลย
                  </PricingAddToCartButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-2">
            ราคาโฆษณา
          </h2>
          <p className="text-gray-600 text-center mb-8">
            ใช้ Token เพื่อโฆษณาร้านของคุณในพื้นที่ที่ต้องการ
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adPricing.map((ad, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {ad.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {ad.description}
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {ad.basePrice}
                  </div>
                </div>
                <ul className="space-y-2">
                  {ad.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>💡</span>
              หมายเหตุสำคัญ
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• ยิ่งสมาชิกเป็นแพ็คเกจสูง ยิ่งได้ส่วนลดโฆษณามากขึ้น</li>
              <li>• Token ที่ได้รับจากแพ็คเกจสามารถนำไปใช้โฆษณาได้ทันที</li>
              <li>• ราคาโฆษณาอาจเปลี่ยนแปลงตามช่วงเวลาและความนิยม</li>
              <li>• Token ไม่มีวันหมดอายุ สามารถสะสมและใช้ได้ตลอด</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            คำถามที่พบบ่อย
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-semibold">Token คืออะไร?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-4 text-gray-600">
                Token คือสกุลเงินภายในระบบที่ใช้สำหรับการโฆษณาและบริการพิเศษต่างๆ 
                สามารถซื้อได้ตามแพ็คเกจที่ระบุ หรือได้รับฟรีจากการสมัครแพ็คเกจรายเดือน
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-semibold">สามารถเปลี่ยนแพ็คเกจได้หรือไม่?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-4 text-gray-600">
                ได้ครับ สามารถอัพเกรดหรือดาวน์เกรดแพ็คเกจได้ทุกเมื่อ 
                ค่าใช้จ่ายจะถูกคำนวณตามสัดส่วนของวันที่เหลืออยู่
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-semibold">Token หมดอายุหรือไม่?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-4 text-gray-600">
                Token ไม่มีวันหมดอายุ สามารถเก็บไว้ใช้ได้ตลอด แม้ว่าจะยกเลิกแพ็คเกจรายเดือนแล้วก็ตาม
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-semibold">มีช่องทางการชำระเงินแบบไหนบ้าง?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="p-4 text-gray-600">
                รองรับการชำระเงินผ่านบัตรเครดิต/เดบิต, พร้อมเพย์, และการโอนเงินผ่านธนาคาร
              </p>
            </details>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-100">
          <h3 className="text-2xl font-bold mb-4">
            พร้อมเริ่มต้นแล้วหรือยัง?
          </h3>
          <p className="text-gray-600 mb-6">
            ลงทะเบียนร้านค้าวันนี้ รับ Token ฟรี 50 Tokens!
          </p>
          <Link
            href="/shop/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ลงทะเบียนเลย
          </Link>
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
