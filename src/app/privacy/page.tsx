// src/app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว - Zablink",
  description: "นโยบายความเป็นส่วนตัวของแพลตฟอร์ม Zablink",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            href="/signin" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-gray-600 mt-2">อัพเดทล่าสุด: 27 ตุลาคม 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              ที่ Zablink เราให้ความสำคัญกับความเป็นส่วนตัวของท่านเป็นอย่างยิ่ง 
              นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีการที่เราเก็บรวบรวม ใช้งาน และปกป้องข้อมูลส่วนบุคคลของท่าน 
              เมื่อท่านใช้บริการของเรา
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ข้อมูลที่เราเก็บรวบรวม</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.1 ข้อมูลที่ท่านให้กับเรา</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>ข้อมูลบัญชี:</strong> ชื่อ อีเมล รหัสผ่าน รูปโปรไฟล์</li>
              <li><strong>ข้อมูลโปรไฟล์:</strong> ชื่อร้าน ที่อยู่ เบอร์โทรศัพท์ ประเภทกิจการ</li>
              <li><strong>เนื้อหาที่สร้าง:</strong> รีวิว รูปภาพ วิดีโอ คอมเมนต์</li>
              <li><strong>ข้อมูลการติดต่อ:</strong> ข้อความที่ส่งถึงทีมสนับสนุน</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.2 ข้อมูลที่เก็บอัตโนมัติ</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>ข้อมูลการใช้งาน:</strong> หน้าที่เข้าชม เวลาที่ใช้ คุณสมบัติที่ใช้</li>
              <li><strong>ข้อมูลอุปกรณ์:</strong> IP address ประเภทเบราว์เซอร์ ระบบปฏิบัติการ</li>
              <li><strong>Cookies:</strong> ข้อมูลที่เก็บเพื่อปรับปรุงประสบการณ์การใช้งาน</li>
              <li><strong>ข้อมูลตำแหน่ง:</strong> ตำแหน่งโดยประมาณจาก IP address (หากได้รับอนุญาต)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.3 ข้อมูลจากบุคคลที่สาม</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Social Login:</strong> ข้อมูลจาก Google, Facebook, LINE (ชื่อ อีเมล รูปโปรไฟล์)</li>
              <li><strong>Analytics:</strong> ข้อมูลจากเครื่องมือวิเคราะห์เพื่อปรับปรุงบริการ</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. การใช้ข้อมูลของท่าน</h2>
            <p className="text-gray-700 leading-relaxed mb-3">เราใช้ข้อมูลของท่านเพื่อ:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ให้บริการและดูแลบัญชีของท่าน</li>
              <li>ปรับปรุงและพัฒนาคุณภาพของบริการ</li>
              <li>ส่งการแจ้งเตือนเกี่ยวกับบัญชีและการใช้งาน</li>
              <li>ตอบกลับคำถามและให้การสนับสนุน</li>
              <li>ป้องกันการฉ้อโกงและรักษาความปลอดภัย</li>
              <li>วิเคราะห์พฤติกรรมผู้ใช้เพื่อปรับปรุงบริการ</li>
              <li>ส่งข่าวสารและโปรโมชั่น (หากท่านยินยอม)</li>
              <li>ปฏิบัติตามกฎหมายและข้อบังคับ</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. การแบ่งปันข้อมูล</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              เราจะไม่ขาย เช่า หรือแบ่งปันข้อมูลส่วนบุคคลของท่านกับบุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.1 การแบ่งปันที่ท่านยินยอม</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ข้อมูลสาธารณะที่ท่านเลือกแสดง (เช่น ชื่อ รูปโปรไฟล์ รีวิว)</li>
              <li>ข้อมูลที่แชร์กับผู้ใช้รายอื่นตามที่ท่านต้องการ</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.2 ผู้ให้บริการภายนอก</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Cloud hosting providers (เช่น AWS, Google Cloud)</li>
              <li>Payment processors (สำหรับการชำระเงิน)</li>
              <li>Analytics services (เช่น Google Analytics)</li>
              <li>Email service providers (สำหรับส่งอีเมล)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.3 ข้อกำหนดทางกฎหมาย</h3>
            <p className="text-gray-700 ml-4">
              เราอาจเปิดเผยข้อมูลหากจำเป็นตามกฎหมาย คำสั่งศาล หรือเพื่อปกป้องสิทธิ์และความปลอดภัย
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. การรักษาความปลอดภัยข้อมูล</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของท่าน ได้แก่:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>การเข้ารหัสข้อมูล (SSL/TLS)</li>
              <li>การควบคุมการเข้าถึงข้อมูลอย่างเข้มงวด</li>
              <li>การตรวจสอบระบบความปลอดภัยเป็นประจำ</li>
              <li>การสำรองข้อมูลอย่างสม่ำเสมอ</li>
              <li>การฝึกอบรมพนักงานเรื่องความปลอดภัยข้อมูล</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              อย่างไรก็ตาม ไม่มีระบบใดที่ปลอดภัย 100% เราจึงไม่สามารถรับประกันความปลอดภัยของข้อมูลได้อย่างสมบูรณ์
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. สิทธิ์ของท่าน</h2>
            <p className="text-gray-700 leading-relaxed mb-3">ท่านมีสิทธิ์ในการ:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>เข้าถึงข้อมูล:</strong> ขอดูข้อมูลส่วนบุคคลที่เราเก็บเกี่ยวกับท่าน</li>
              <li><strong>แก้ไขข้อมูล:</strong> อัพเดทหรือแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
              <li><strong>ลบข้อมูล:</strong> ขอให้ลบข้อมูลของท่าน (ภายใต้ข้อจำกัดบางประการ)</li>
              <li><strong>ส่งออกข้อมูล:</strong> ขอรับสำเนาข้อมูลของท่านในรูปแบบที่อ่านได้</li>
              <li><strong>ยกเลิกการยินยอม:</strong> ถอนความยินยอมในการใช้ข้อมูลบางประเภท</li>
              <li><strong>คัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลบางประเภท</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              หากต้องการใช้สิทธิ์เหล่านี้ กรุณาติดต่อเราที่ privacy@zablink.com
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies และเทคโนโลยีติดตาม</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              เราใช้ cookies และเทคโนโลยีที่คล้ายกันเพื่อ:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>จดจำการตั้งค่าและความชอบของท่าน</li>
              <li>เก็บสถานะการเข้าสู่ระบบ</li>
              <li>วิเคราะห์การใช้งานและปรับปรุงบริการ</li>
              <li>แสดงเนื้อหาที่เหมาะสมกับท่าน</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              ท่านสามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธ cookies ได้ แต่อาจส่งผลต่อการใช้งานบางคุณสมบัติ
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. การเก็บรักษาข้อมูล</h2>
            <p className="text-gray-700 leading-relaxed">
              เราจะเก็บรักษาข้อมูลของท่านไว้เท่าที่จำเป็นเพื่อให้บริการ หรือตามที่กฎหมายกำหนด 
              เมื่อท่านลบบัญชี เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้ภายใน 90 วัน 
              (ยกเว้นข้อมูลที่จำเป็นต้องเก็บตามกฎหมาย)
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. ข้อมูลของเด็ก</h2>
            <p className="text-gray-700 leading-relaxed">
              บริการของเราไม่มีวัตถุประสงค์สำหรับบุคคลอายุต่ำกว่า 13 ปี 
              เราไม่เก็บรวบรวมข้อมูลส่วนบุคคลจากเด็กโดยจงใจ 
              หากท่านทราบว่าเด็กให้ข้อมูลกับเรา กรุณาติดต่อเราเพื่อให้ลบข้อมูลนั้น
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. การโอนข้อมูลระหว่างประเทศ</h2>
            <p className="text-gray-700 leading-relaxed">
              ข้อมูลของท่านอาจถูกโอนและเก็บรักษาไว้ในเซิร์ฟเวอร์ที่อยู่นอกประเทศไทย 
              เราจะใช้มาตรการที่เหมาะสมเพื่อให้แน่ใจว่าข้อมูลของท่านได้รับการปกป้องตามนโยบายนี้
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. การเปลี่ยนแปลงนโยบาย</h2>
            <p className="text-gray-700 leading-relaxed">
              เราอาจอัพเดทนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว 
              การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ท่านทราบผ่านอีเมลหรือประกาศบนเว็บไซต์ 
              กรุณาตรวจสอบนโยบายนี้เป็นประจำ
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. ติดต่อเรา</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการใช้สิทธิ์ของท่าน 
              กรุณาติดต่อเราที่:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</strong></p>
              <p><strong>อีเมล:</strong> privacy@zablink.com</p>
              <p><strong>อีเมลทั่วไป:</strong> support@zablink.com</p>
              <p><strong>เว็บไซต์:</strong> www.zablink.com</p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link href="/terms" className="text-blue-600 hover:underline">
            เงื่อนไขการใช้งาน
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/signin" className="text-blue-600 hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}