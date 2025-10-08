// src/app/page.tsx

import React from 'react';
import Image from 'next/image'; // ต้อง import Image component จาก next/image

/**
 * @title ComingSoon Page Component with Custom Logo and Blue Gradient
 * @description หน้า Landing Page พร้อมโลโก้ตรงกลางและพื้นหลังไล่ระดับสีขาวไปฟ้าอ่อนๆ ที่ด้านล่าง
 */
export default function ComingSoon() {
  return (
    // Container หลัก: สีขาวเต็มหน้าจอ, จัดกึ่งกลาง
    <div className="flex flex-col items-center justify-center min-h-screen bg-white overflow-hidden relative">
      
      {/* Blue Gradient Background Area
        - ตำแหน่ง: อยู่ด้านหลังเนื้อหา (z-0) และยึดติดด้านล่าง (bottom-0)
        - ความสูง: 1/3 ของหน้าจอ (h-1/3) หรือตามที่คุณต้องการ
        - Gradient: จากสีฟ้าอ่อน (#e3f2fd) ขึ้นไปหาขาว (#ffffff)
      */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1/3 w-full z-0 opacity-80" 
        style={{
          background: 'linear-gradient(to top, #5badd4 0%, #ffffff 100%)' // ฟ้าอ่อนไล่ไปหาขาว
        }}
      ></div>

      {/* Content Container
        - ตำแหน่ง: อยู่ด้านหน้า (z-10) และจัดกึ่งกลาง
      */}
      <div className="relative z-10 text-center p-6 max-w-xl flex flex-col items-center">\

        {/* Heading */}
        <h2 className="text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-4 leading-tight">
          อีกไม่นานเกินรอ
        </h2>
        
        {/* Logo */}
        <div className="mb-8">
          <Image 
            src="/images/big-logo-w-text.png" // Path ไปยังไฟล์โลโก้ของคุณในโฟลเดอร์ public
            alt="Zablink Logo" 
            width={160}    // กำหนดความกว้างของโลโก้ (ปรับได้ตามต้องการ)
            height={158}   // กำหนดความสูงของโลโก้ (ปรับได้ตามต้องการ)
            priority       // โหลดรูปภาพนี้เป็นอันดับแรก (สำหรับ LCP)
            layout="responsive" 
            style = {{ width:'100%', height:'auto'}}
          />
        </div> 
        
        
        
        {/* Sub-text */}
        <p className="mt-4 text-xl text-gray-600 font-light">
          เว็บที่จะช่วยให้พ่อค้าแม่ค้าร้านอาหารเครื่องดื่มขายได้ดีขึ้น และ Content Creator สายรีวิวอาหาร จะมีรายได้เพิ่มขึ้น
        </p>
        
      </div>

      {/* Footer Placeholder */}
      <footer className="absolute bottom-4 text-xs text-gray-400 z-10">
        © {new Date().getFullYear()} Vertex Horizon Co.,Ltd. All rights reserved.
      </footer>
    </div>
  );
}