// src/app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "เงื่อนไขการใช้งาน - Zablink",
  description: "เงื่อนไขการใช้งานแพลตฟอร์ม Zablink",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">เงื่อนไขการใช้งาน</h1>
          <p className="text-gray-600 mt-2">อัพเดทล่าสุด: 27 ตุลาคม 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. การยอมรับเงื่อนไข</h2>
            <p className="text-gray-700 leading-relaxed">
              การเข้าใช้งานแพลตฟอร์ม Zablink ("บริการ") ถือว่าท่านได้อ่าน เข้าใจ และยอมรับเงื่อนไขการใช้งานทั้งหมดนี้ 
              หากท่านไม่ยอมรับเงื่อนไขใดๆ กรุณาอย่าใช้งานบริการของเรา
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. การใช้งานบริการ</h2>
            <div className="space-y-3 text-gray-700">
              <p>ท่านตกลงที่จะใช้บริการของเราอย่างถูกต้องตามกฎหมาย และจะไม่:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือไม่ได้รับอนุญาต</li>
                <li>แอบอ้างเป็นบุคคลหรือองค์กรอื่น</li>
                <li>อัพโหลดหรือเผยแพร่เนื้อหาที่ละเมิดลิขสิทธิ์</li>
                <li>ใช้วิธีการใดๆ ที่อาจทำให้บริการเสียหาย หยุดชะงัก หรือทำงานผิดปกติ</li>
                <li>เข้าถึงระบบของเราโดยไม่ได้รับอนุญาต</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. บัญชีผู้ใช้งาน</h2>
            <div className="space-y-3 text-gray-700">
              <p>เมื่อสร้างบัญชีกับเรา ท่านตกลงที่จะ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นปัจจุบัน</li>
                <li>รักษาความปลอดภัยของรหัสผ่านของท่าน</li>
                <li>แจ้งให้เราทราบทันทีหากมีการใช้งานบัญชีโดยไม่ได้รับอนุญาต</li>
                <li>รับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่าน</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. เนื้อหาที่ผู้ใช้สร้าง</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              เมื่อท่านอัพโหลดหรือเผยแพร่เนื้อหาบนแพลตฟอร์มของเรา (เช่น รีวิว รูปภาพ วิดีโอ) ท่านรับรองว่า:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ท่านเป็นเจ้าของหรือมีสิทธิ์ในการใช้เนื้อหานั้น</li>
              <li>เนื้อหาไม่ละเมิดสิทธิ์ของบุคคลอื่น</li>
              <li>เนื้อหาไม่มีข้อความหมิ่นประมาท ลามก หรือผิดกฎหมาย</li>
              <li>ท่านให้สิทธิ์เราในการใช้ แสดง และเผยแพร่เนื้อหานั้นบนแพลตฟอร์ม</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. ทรัพย์สินทางปัญญา</h2>
            <p className="text-gray-700 leading-relaxed">
              บริการและเนื้อหาทั้งหมด (รวมถึงแต่ไม่จำกัดเพียง โลโก้ กราฟิก ซอฟต์แวร์) 
              เป็นทรัพย์สินของ Zablink และได้รับความคุ้มครองตามกฎหมายลิขสิทธิ์และทรัพย์สินทางปัญญา 
              ท่านไม่ได้รับอนุญาตให้คัดลอก ดัดแปลง หรือแจกจ่ายเนื้อหาดังกล่าวโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. การยกเลิกและระงับบริการ</h2>
            <p className="text-gray-700 leading-relaxed">
              เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของท่านได้ทันที โดยไม่ต้องแจ้งให้ทราบล่วงหน้า 
              หากเราเชื่อว่าท่านละเมิดเงื่อนไขการใช้งานนี้ หรือมีพฤติกรรมที่เป็นอันตรายต่อผู้ใช้งานรายอื่น
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. ข้อจำกัดความรับผิด</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              บริการของเราให้บริการ "ตามสภาพที่เป็น" (AS IS) และ "ตามที่มีอยู่" (AS AVAILABLE) 
              เราจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจาก:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>การใช้หรือไม่สามารถใช้บริการของเรา</li>
              <li>ความล่าช้า ข้อผิดพลาด หรือการหยุดชะงักของบริการ</li>
              <li>การสูญหายของข้อมูล</li>
              <li>การกระทำของผู้ใช้งานรายอื่น</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. การเปลี่ยนแปลงเงื่อนไข</h2>
            <p className="text-gray-700 leading-relaxed">
              เราขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขการใช้งานนี้ได้ตลอดเวลา 
              การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ท่านทราบผ่านอีเมลหรือประกาศบนเว็บไซต์ 
              การใช้งานบริการต่อไปหลังจากมีการเปลี่ยนแปลง ถือว่าท่านยอมรับเงื่อนไขใหม่
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. กฎหมายที่ใช้บังคับ</h2>
            <p className="text-gray-700 leading-relaxed">
              เงื่อนไขการใช้งานนี้อยู่ภายใต้บังคับของกฎหมายประเทศไทย 
              ข้อพิพาทใดๆ ที่เกิดขึ้นจากหรือเกี่ยวกับเงื่อนไขนี้จะอยู่ในเขตอำนาจของศาลไทย
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. ติดต่อเรา</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              หากท่านมีคำถามเกี่ยวกับเงื่อนไขการใช้งานนี้ กรุณาติดต่อเราที่:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>อีเมล:</strong> legal@zablink.com</p>
              <p><strong>เว็บไซต์:</strong> www.zablink.com</p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            นโยบายความเป็นส่วนตัว
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