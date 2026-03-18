import Link from "next/link";

export const metadata = {
  title: "นโยบายคืนเงิน - Zablink",
  description: "นโยบายคืนเงินของ Zablink: โดยทั่วไปไม่คืนเงิน",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            ← กลับหน้าแรก
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">นโยบายคืนเงิน</h1>
          <p className="text-gray-600 mt-2">อัปเดตล่าสุด: 17 มีนาคม 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ไม่คืนเงิน</h2>
            <p className="text-gray-700 leading-relaxed">
              การซื้อแพ็กเกจ สมาชิก Token และบริการที่เกี่ยวข้องทั้งหมดถือเป็น <strong>การขายขาด</strong>
              และโดยทั่วไป <strong>ไม่สามารถขอคืนเงินได้</strong> ไม่ว่ากรณีใดหลังจากธุรกรรมได้รับการยืนยันแล้ว
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. กรณีที่อาจพิจารณาเป็นกรณีพิเศษ</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>มีการเรียกเก็บเงินซ้ำจากระบบชำระเงินโดยตรง</li>
              <li>เกิดข้อผิดพลาดทางเทคนิคจากฝั่งระบบของเราและยังไม่ได้ส่งมอบบริการ</li>
              <li>กรณีที่กฎหมายบังคับให้ต้องคืนเงิน</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              กรณีข้างต้นต้องผ่านการตรวจสอบโดยทีมงาน และการอนุมัติขึ้นอยู่กับดุลยพินิจของบริษัท
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. รายการที่ไม่คืนเงิน</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ค่าธรรมเนียม Payment Gateway และค่าธรรมเนียมธนาคาร</li>
              <li>แพ็กเกจที่เริ่มใช้งานแล้ว</li>
              <li>Token ที่ถูกเติมเข้ากระเป๋าแล้วหรือถูกนำไปใช้งานแล้ว</li>
              <li>ค่าบริการโฆษณาหรือการโปรโมทที่แสดงผลแล้ว</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. วิธีติดต่อกรณีพบปัญหา</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              หากคุณเชื่อว่ามีการเรียกเก็บเงินผิดพลาด กรุณาติดต่อเรา ภายใน 7 วันนับจากวันที่ทำรายการ
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>อีเมล:</strong> support@zablink.com</p>
              <p><strong>หัวข้อ:</strong> Refund Inquiry</p>
              <p><strong>เว็บไซต์:</strong> www.zablink.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

