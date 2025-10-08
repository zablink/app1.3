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
          background: 'linear-gradient(to top, #e3f2fd 0%, #ffffff 100%)' // ฟ้าอ่อนไล่ไปหาขาว
        }}
      ></div>

      {/* Content Container
        - ตำแหน่ง: อยู่ด้านหน้า (z-10) และจัดกึ่งกลาง
      */}
      <div className="relative z-10 text-center p-6 max-w-xl flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-8">
          <Image 
            src="/images/big-logo-w-text.png" // Path ไปยังไฟล์โลโก้ของคุณในโฟลเดอร์ public
            alt="Zablink Logo" 
            width={250}    // กำหนดความกว้างของโลโก้ (ปรับได้ตามต้องการ)
            height={auto}   // กำหนดความสูงของโลโก้ (ปรับได้ตามต้องการ)
            priority       // โหลดรูปภาพนี้เป็นอันดับแรก (สำหรับ LCP)
          />
        </div>
        
        {/* Heading */}
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-4 leading-tight">
          เว็บไซต์ใหม่<br className="sm:hidden" />**กำลังจะมา!**
        </h1>
        
        {/* Sub-text */}
        <p className="mt-4 text-xl text-gray-600 font-light">
          เรากำลังทำงานอย่างขะมักเขม้นเพื่อสร้างประสบการณ์ที่ดีที่สุดให้กับคุณ 
          โปรดติดตามการเปิดตัวอย่างเป็นทางการในเร็วๆ นี้
        </p>
        
        {/* Contact/CTA Area */}
        <div className="mt-12 space-y-4 w-full">
          
          {/* Email Subscription (ตัวอย่าง) */}
          <div className="flex justify-center flex-wrap gap-2">
            <input 
              type="email" 
              placeholder="กรอกอีเมลเพื่อรับการแจ้งเตือน" 
              className="p-3 border border-gray-300 rounded-lg shadow-sm w-full max-w-xs focus:ring-indigo-500 focus:border-indigo-500 text-base" 
            />
            <button 
              className="px-5 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md"
            >
              แจ้งเตือน
            </button>
          </div>
          
          {/* Social Media/Contact */}
          <p className="text-sm text-gray-500 pt-4">
            ติดต่อสอบถาม: <a href="mailto:contact@yourdomain.com" className="text-indigo-600 hover:text-indigo-500 font-medium transition duration-150 ease-in-out">contact@yourdomain.com</a>
          </p>
        </div>
      </div>

      {/* Footer Placeholder */}
      <footer className="absolute bottom-4 text-xs text-gray-400 z-10">
        © {new Date().getFullYear()} Vertex Horizon Co.,Ltd. All rights reserved.
      </footer>
    </div>
  );
}