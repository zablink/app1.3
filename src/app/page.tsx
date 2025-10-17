import React from 'react';

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-[#4A90A4] via-[#7FB3C0] to-[#A8D5E2] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 relative">
            <img 
              src="/images/big-logo-w-text.png" 
              alt="Zablink Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Main Tagline */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-16 px-4">
          Zablink ช่วยเติมฝันและลมหายใจของคุณ
        </h1>

        {/* Three Column Grid with Images */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 px-4 max-w-5xl mx-auto">
          {/* Column 1 */}
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 mb-6 rounded-full overflow-hidden shadow-lg">
              <img 
                src="/images/soon/ucon1.png" 
                alt="Content Creator"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg text-white font-medium leading-relaxed">
              ช่วยร้านค้าให้ขายได้มากขึ้น<br />ลดการซื้อ Ad แพงๆ
            </p>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 mb-6 rounded-full overflow-hidden shadow-lg">
              <img 
                src="/images/soon/ucon2.png" 
                alt="Food Delivery"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg text-white font-medium leading-relaxed">
              ลูกค้ามาที่เดียว<br />มีร้านค้าของทุก App ให้เลือก
            </p>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 mb-6 rounded-full overflow-hidden shadow-lg">
              <img 
                src="/images/soon/ucon3.png" 
                alt="Food Variety"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg text-white font-medium leading-relaxed">
              ช่วยหารายได้ให้<br />Content creator สายรีวิวอาหาร
            </p>
          </div>
        </div>

        {/* Coming Soon Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-12">
          อีกไม่กี่อึดใจ มาพบกัน
        </h2>

        {/* Optional: Animated dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}